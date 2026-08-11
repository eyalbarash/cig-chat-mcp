/**
 * cig.chat identifies most flow-level entities by opaque namespace strings (`f123t456`).
 * Agents have names, not namespaces. This resolves one into the other so a caller can say
 * "VIP customers" and the request still carries `tag_ns=f123t456`.
 */

import type { CigChatClient } from './client.js';
import type { OperationSpec, ParamSpec } from './types.js';

/** Namespace ids look like `f<digits><1-2 letters><alnum>` — e.g. f123t456, f1cn1. */
const NS_SHAPE = /^f\d+[a-z]{1,2}[a-z0-9]*$/i;
/** Sub-flow / flow ids also appear as `flow123`. */
const FLOW_SHAPE = /^flow\d+$/i;

export function looksLikeNs(value: string): boolean {
  return NS_SHAPE.test(value) || FLOW_SHAPE.test(value);
}

type Lookup = { path: string; valueField: string; labelField: string };

export const LOOKUPS: Record<string, Lookup> = {
  tag: { path: '/flow/tags', valueField: 'tag_ns', labelField: 'name' },
  user_field: { path: '/flow/user-fields', valueField: 'var_ns', labelField: 'name' },
  bot_field: { path: '/flow/bot-fields', valueField: 'var_ns', labelField: 'name' },
  flow: { path: '/flow/subflows', valueField: 'sub_flow_ns', labelField: 'name' },
  segment: { path: '/flow/segments', valueField: 'segment_ns', labelField: 'name' },
  custom_event: { path: '/flow/custom-events', valueField: 'event_ns', labelField: 'name' },
  ai_agent: { path: '/flow/ai-agents', valueField: 'ai_agent_ns', labelField: 'name' },
  ai_task: { path: '/flow/ai-tasks', valueField: 'ai_task_ns', labelField: 'name' },
  agent: { path: '/flow/agents', valueField: 'id', labelField: 'name' },
  agent_group: { path: '/team/agent-groups', valueField: 'id', labelField: 'name' },
  label: { path: '/team/labels', valueField: 'name', labelField: 'name' },
  product: { path: '/shop/products', valueField: 'id', labelField: 'name' },
};

const CACHE_TTL_MS = 5 * 60 * 1000;

export type ResolveOutcome =
  { ok: true; args: Record<string, unknown> } | { ok: false; error: string };

export class NsResolver {
  private readonly cache = new Map<string, { value: string; expiresAt: number }>();

  constructor(private readonly client: CigChatClient) {}

  /** Lists a lookup resource as `{name, ns}` pairs. Backs `cigchat_resolve`. */
  async list(kind: string, name?: string): Promise<{ name: string; ns: string }[]> {
    const lookup = LOOKUPS[kind];
    if (!lookup) throw new Error(`Unknown lookup kind "${kind}".`);
    const res = await this.client.request<{ data?: Record<string, unknown>[] }>({
      method: 'GET',
      path: lookup.path,
      query: { limit: 100, page: 1, ...(name ? { name } : {}) },
    });
    if (!res.ok) return [];
    const rows = Array.isArray(res.data?.data) ? res.data.data : [];
    return rows
      .map((r) => ({
        name: String(r[lookup.labelField] ?? ''),
        ns: String(r[lookup.valueField] ?? ''),
      }))
      .filter((r) => r.ns !== '');
  }

  private async resolveOne(kind: string, raw: string): Promise<string> {
    if (looksLikeNs(raw)) return raw;
    // Labels are keyed by name upstream — nothing to translate.
    if (kind === 'label') return raw;

    const cacheKey = `${kind}:${raw.toLowerCase()}`;
    const hit = this.cache.get(cacheKey);
    const now = Date.now();
    if (hit && hit.expiresAt > now) return hit.value;

    const rows = await this.list(kind, raw);
    const exact = rows.filter((r) => r.name.toLowerCase() === raw.toLowerCase());

    if (exact.length === 1) {
      const found = exact[0]!.ns;
      this.cache.set(cacheKey, { value: found, expiresAt: now + CACHE_TTL_MS });
      return found;
    }
    if (exact.length > 1) {
      throw new Error(
        `"${raw}" matches ${exact.length} ${kind}s. Pass the namespace id instead. ` +
          `Candidates: ${exact.map((r) => `${r.name}=${r.ns}`).join(', ')}`,
      );
    }
    const near = rows.slice(0, 8).map((r) => `${r.name}=${r.ns}`);
    throw new Error(
      `No ${kind} named "${raw}" was found.` +
        (near.length ? ` Closest available: ${near.join(', ')}` : '') +
        ` Use cigchat_resolve to list them.`,
    );
  }

  private async walk(spec: ParamSpec, value: unknown): Promise<unknown> {
    if (value === undefined || value === null) return value;

    if (spec.type === 'array' && Array.isArray(value)) {
      const itemSpec = spec.items;
      if (!itemSpec) return value;
      return Promise.all(value.map((v) => this.walk(itemSpec, v)));
    }
    if (spec.type === 'object' && spec.properties && value && typeof value === 'object') {
      const src = value as Record<string, unknown>;
      const out: Record<string, unknown> = { ...src };
      for (const child of spec.properties) {
        if (child.name in src) out[child.name] = await this.walk(child, src[child.name]);
      }
      return out;
    }
    if (spec.nsKind && typeof value === 'string' && value !== '') {
      return this.resolveOne(spec.nsKind, value);
    }
    return value;
  }

  async resolveArgs(op: OperationSpec, args: Record<string, unknown>): Promise<ResolveOutcome> {
    const out: Record<string, unknown> = { ...args };
    try {
      for (const p of op.params) {
        if (!(p.name in args)) continue;
        out[p.name] = await this.walk(p, args[p.name]);
      }
      return { ok: true, args: out };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'resolution failed' };
    }
  }
}
