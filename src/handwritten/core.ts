/**
 * Hand-written tools that have no single API endpoint behind them:
 * identity, name→namespace lookup, and toolset discovery.
 */

import { z } from 'zod';
import { defineTool, type CigChatTool, type ToolResult } from '../tools.js';
import { LOOKUPS } from '../resolve.js';

const LOOKUP_KINDS = Object.keys(LOOKUPS) as [string, ...string[]];

const whoamiTool = defineTool({
  name: 'cigchat_whoami',
  description:
    'Verify the configured cig.chat API token and return the account it belongs to. ' +
    'Call this first when anything returns 401, or to confirm which bot you are connected to. ' +
    'Remember: one token controls exactly one bot. [GET /me]',
  toolset: 'core',
  tier: 'read',
  schema: z.object({}),
  run: async (ctx) => {
    const me = await ctx.client.request({ method: 'GET', path: '/me' });
    if (!me.ok) {
      return {
        ok: false,
        error:
          `${me.error}\nThe token in CIGCHAT_API_TOKEN could not be verified. ` +
          `Generate a fresh one in cig.chat → your bot → Settings → API.`,
      };
    }
    return { ok: true, data: me.data };
  },
});

const resolveTool = defineTool({
  name: 'cigchat_resolve',
  description:
    'Look up the namespace id for a tag, flow, field, segment, agent or other entity by name — ' +
    'or list what is available. cig.chat identifies most things by opaque ids like "f123t456". ' +
    'Most tools accept a plain name and resolve it for you; use this when you want to show the ' +
    'human the available options, or to disambiguate when a name matched more than one thing.',
  toolset: 'core',
  tier: 'read',
  schema: z.object({
    kind: z.enum(LOOKUP_KINDS).describe('Which kind of entity to look up.'),
    name: z
      .string()
      .optional()
      .describe('Filter by name. Omit to list everything (capped at 100).'),
  }),
  run: async (ctx, args): Promise<ToolResult> => {
    try {
      const rows = await ctx.resolver.list(args.kind, args.name);
      return {
        ok: true,
        data: {
          kind: args.kind,
          count: rows.length,
          results: rows,
          ...(rows.length === 100
            ? { note: 'Capped at 100 results — narrow with `name` if what you need is missing.' }
            : {}),
        },
      };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'lookup failed' };
    }
  },
});

const listToolsetsTool = defineTool({
  name: 'cigchat_list_toolsets',
  description:
    'List every toolset this server can expose, how many tools each holds, and whether it is ' +
    'currently enabled. Use this when a tool you expected is missing — the toolset may be off.',
  toolset: 'core',
  tier: 'read',
  schema: z.object({}),
  run: async (ctx) => ({
    ok: true,
    data: {
      toolsets: ctx.registry.describeToolsets(),
      active_tool_count: ctx.registry.active().length,
      hint:
        'Set CIGCHAT_TOOLSETS to a comma-separated list (or "all") to change this, or call ' +
        'cigchat_enable_toolset to switch one on for the rest of this session.',
    },
  }),
});

const enableToolsetTool = defineTool({
  name: 'cigchat_enable_toolset',
  description:
    'Switch a toolset on for the rest of this session, making its tools available immediately. ' +
    'Use after cigchat_list_toolsets shows the one you need is disabled.',
  toolset: 'core',
  tier: 'read',
  schema: z.object({
    toolset: z.string().describe('Toolset id, as returned by cigchat_list_toolsets.'),
  }),
  run: async (ctx, args) => {
    const ok = ctx.registry.enable(args.toolset);
    if (!ok) {
      return {
        ok: false,
        error: `Unknown toolset "${args.toolset}". Call cigchat_list_toolsets for valid ids.`,
      };
    }
    await ctx.onToolsChanged?.();
    return {
      ok: true,
      data: {
        enabled: args.toolset,
        active_tool_count: ctx.registry.active().length,
      },
    };
  },
});

export const coreTools: CigChatTool[] = [
  whoamiTool,
  resolveTool,
  listToolsetsTool,
  enableToolsetTool,
];
