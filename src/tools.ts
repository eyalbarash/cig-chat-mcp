/**
 * The tool layer. Deliberately free of any MCP SDK import so tools stay unit-testable
 * against a fake client without spinning up a transport.
 */

import { z } from 'zod';
import type { OperationSpec, ParamSpec, Tier } from './types.js';
import type { ApiResult, CigChatClient } from './client.js';
import type { SafetyGate } from './safety.js';
import type { NsResolver } from './resolve.js';

export type { OperationSpec, ParamSpec };

export type ToolResult = {
  ok: boolean;
  data?: unknown;
  error?: string;
  dry_run?: boolean;
  would_call?: unknown;
  truncated?: boolean;
  retryable?: boolean;
  /** Set when a guarded tool needs a human to approve before it will run. */
  requires_confirmation?: boolean;
  impact?: string;
  audience_estimate?: { count: number; exact: boolean };
  confirmation_token?: string;
  expires_in_seconds?: number;
  next_step?: string;
};

export type ToolContext = {
  client: CigChatClient;
  safety: SafetyGate;
  resolver: NsResolver;
  registry: ToolRegistryLike;
  /** Notifies the client that the tool list changed (dynamic toolsets). */
  onToolsChanged?: (() => Promise<void>) | undefined;
};

/** The slice of the registry that tools may use, kept narrow to avoid a real import cycle. */
export type ToolRegistryLike = {
  active: () => CigChatTool[];
  enable: (id: string) => boolean;
  describeToolsets: () => {
    id: string;
    label: string;
    labelHe: string;
    description: string;
    toolCount: number;
    enabled: boolean;
  }[];
};

export type CigChatTool = {
  name: string;
  description: string;
  toolset: string;
  tier: Tier;
  schema: z.ZodObject<z.ZodRawShape>;
  invoke: (ctx: ToolContext, rawArgs: unknown) => Promise<ToolResult>;
};

function baseSchema(p: ParamSpec): z.ZodTypeAny {
  switch (p.type) {
    case 'integer':
      return z.number().int();
    case 'number':
      return z.number();
    case 'boolean':
      return z.boolean();
    case 'array':
      return z.array(p.items ? paramToZod(p.items) : z.unknown());
    case 'object': {
      if (!p.properties || p.properties.length === 0) return z.record(z.unknown());
      const shape: z.ZodRawShape = {};
      for (const child of p.properties) shape[child.name] = paramToZod(child);
      return z.object(shape);
    }
    case 'any':
      return z.unknown();
    case 'string':
    default:
      // Enums are advisory: the API adds values faster than the spec is republished,
      // so we describe the known set rather than rejecting anything outside it.
      return z.string();
  }
}

export function describeParam(p: ParamSpec): string {
  const bits: string[] = [];
  if (p.description) bits.push(p.description);
  if (p.enum?.length) bits.push(`One of: ${p.enum.join(', ')}.`);
  if (p.nsKind) {
    bits.push(
      `Accepts either the ${p.nsKind} namespace id or the ${p.nsKind}'s exact name — ` +
        `the server resolves names automatically.`,
    );
  }
  if (p.example) bits.push(`Example: ${p.example}`);
  return bits.join(' ').trim();
}

export function paramToZod(p: ParamSpec): z.ZodTypeAny {
  let schema = baseSchema(p);
  const desc = describeParam(p);
  if (desc) schema = schema.describe(desc);
  return p.required ? schema : schema.optional();
}

export function buildSchema(params: ParamSpec[]): z.ZodObject<z.ZodRawShape> {
  const shape: z.ZodRawShape = {};
  for (const p of params) shape[p.name] = paramToZod(p);
  return z.object(shape);
}

export function toToolResult(r: ApiResult): ToolResult {
  if (r.ok) {
    return {
      ok: true,
      data: r.data ?? null,
      ...(r.dry_run ? { dry_run: true } : {}),
      ...(r.would_call ? { would_call: r.would_call } : {}),
      ...(r.truncated
        ? {
            truncated: true,
            next_step: 'Response was truncated. Narrow the query or request a later page.',
          }
        : {}),
    };
  }
  return {
    ok: false,
    error: r.error ?? 'request failed',
    ...(r.retryable ? { retryable: true } : {}),
  };
}

/** Splits validated args back into path / query / body by their declared location. */
export function partitionArgs(
  op: OperationSpec,
  args: Record<string, unknown>,
): {
  path: Record<string, unknown>;
  query: Record<string, unknown>;
  body: Record<string, unknown>;
} {
  const out = {
    path: {} as Record<string, unknown>,
    query: {} as Record<string, unknown>,
    body: {} as Record<string, unknown>,
  };
  for (const p of op.params) {
    const v = args[p.name];
    if (v === undefined) continue;
    out[p.in][p.name] = v;
  }
  return out;
}

export function renderPath(template: string, pathArgs: Record<string, unknown>): string {
  return template.replace(/\{(\w+)\}/g, (_m, key: string) => {
    const v = pathArgs[key];
    return encodeURIComponent(String(v ?? ''));
  });
}

/** Turns a generated OperationSpec into a runnable tool. */
export function toolFromOperation(op: OperationSpec): CigChatTool {
  const schema = buildSchema(op.params);
  const confirmable = op.tier === 'broadcast' || op.tier === 'destructive';
  const fullSchema = confirmable
    ? schema.extend({
        confirm: z
          .string()
          .optional()
          .describe(
            'Confirmation token from this tool\'s previous "requires_confirmation" response. ' +
              'Call without it first, show the human the impact statement, and only pass the ' +
              'token once they have approved.',
          ),
      })
    : schema;

  return {
    name: op.name,
    description: op.description,
    toolset: op.toolset,
    tier: op.tier,
    schema: fullSchema,
    invoke: async (ctx, rawArgs) => {
      const parsed = fullSchema.parse(rawArgs ?? {}) as Record<string, unknown>;
      const { confirm, ...callArgs } = parsed;

      const resolved = await ctx.resolver.resolveArgs(op, callArgs);
      if (!resolved.ok) return { ok: false, error: resolved.error ?? 'could not resolve' };

      if (confirmable) {
        const gate = await ctx.safety.check(op, resolved.args, confirm as string | undefined);
        if (!gate.allowed) return gate.result;
      }

      const { path, query, body } = partitionArgs(op, resolved.args);
      const result = await ctx.client.request({
        method: op.method,
        path: renderPath(op.path, path),
        query,
        ...(Object.keys(body).length > 0 ? { body } : {}),
        tier: op.tier,
        ...(op.readOnly ? { readOnly: true } : {}),
      });
      return toToolResult(result);
    },
  };
}

/** Defines a hand-written tool with its arg typing preserved inside `run`. */
export function defineTool<S extends z.ZodObject<z.ZodRawShape>>(spec: {
  name: string;
  description: string;
  toolset: string;
  tier: Tier;
  schema: S;
  run: (ctx: ToolContext, args: z.infer<S>) => Promise<ToolResult>;
}): CigChatTool {
  return {
    name: spec.name,
    description: spec.description,
    toolset: spec.toolset,
    tier: spec.tier,
    schema: spec.schema,
    invoke: async (ctx, rawArgs) => spec.run(ctx, spec.schema.parse(rawArgs ?? {}) as z.infer<S>),
  };
}
