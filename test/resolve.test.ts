import { describe, expect, it, vi } from 'vitest';
import { NsResolver, looksLikeNs } from '../src/resolve.js';
import { CigChatClient } from '../src/client.js';
import { loadConfig } from '../src/config.js';
import type { OperationSpec } from '../src/types.js';

function resolverWith(rows: Record<string, unknown>[]): {
  resolver: NsResolver;
  requests: number;
} {
  const state = { requests: 0 };
  const fetchImpl = vi.fn(async () => {
    state.requests++;
    return new Response(JSON.stringify({ data: rows }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }) as unknown as typeof fetch;

  const config = loadConfig({
    env: { CIGCHAT_API_TOKEN: 't', CIGCHAT_RPS: '1000' } as NodeJS.ProcessEnv,
  });
  const resolver = new NsResolver(new CigChatClient(config, fetchImpl));
  return {
    resolver,
    get requests() {
      return state.requests;
    },
  } as { resolver: NsResolver; requests: number };
}

const OP: OperationSpec = {
  name: 'cigchat_broadcast_by_tag',
  description: 'x',
  toolset: 'messaging',
  tier: 'broadcast',
  method: 'POST',
  path: '/subscriber/broadcast-by-tag',
  operationId: 'flowBotUserBroadcastByTag',
  params: [
    {
      name: 'tags',
      in: 'body',
      type: 'array',
      nsKind: 'tag',
      items: { name: 'tags_item', in: 'body', type: 'string', nsKind: 'tag' },
    },
    { name: 'sub_flow_ns', in: 'body', type: 'string', nsKind: 'flow' },
    { name: 'name', in: 'body', type: 'string' },
  ],
};

describe('namespace shape detection', () => {
  it.each(['f123t456', 'f1cn1', 'f123ag456', 'flow123'])('recognises %s', (v) => {
    expect(looksLikeNs(v)).toBe(true);
  });

  it.each(['VIP customers', 'my tag', 'welcome-flow', ''])('rejects %s', (v) => {
    expect(looksLikeNs(v)).toBe(false);
  });
});

describe('resolving arguments', () => {
  it('passes namespace ids through without any lookup', async () => {
    const h = resolverWith([]);
    const out = await h.resolver.resolveArgs(OP, { tags: ['f123t456'], sub_flow_ns: 'f123s789' });
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.args['tags']).toEqual(['f123t456']);
    expect(h.requests).toBe(0);
  });

  it('translates a human name inside an array', async () => {
    const h = resolverWith([{ name: 'VIP customers', tag_ns: 'f9t9' }]);
    const out = await h.resolver.resolveArgs(OP, { tags: ['VIP customers'] });
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.args['tags']).toEqual(['f9t9']);
  });

  it('leaves non-namespace parameters alone', async () => {
    const h = resolverWith([{ name: 'VIP', tag_ns: 'f9t9' }]);
    const out = await h.resolver.resolveArgs(OP, { tags: ['VIP'], name: 'August campaign' });
    if (!out.ok) return;
    expect(out.args['name']).toBe('August campaign');
  });

  it('refuses to guess when a name is ambiguous', async () => {
    const h = resolverWith([
      { name: 'sale', tag_ns: 'f1t1' },
      { name: 'sale', tag_ns: 'f1t2' },
    ]);
    const out = await h.resolver.resolveArgs(OP, { tags: ['sale'] });
    expect(out.ok).toBe(false);
    if (out.ok) return;
    expect(out.error).toContain('matches 2');
    expect(out.error).toContain('f1t1');
  });

  it('reports what does exist when nothing matches', async () => {
    const h = resolverWith([{ name: 'other', tag_ns: 'f1t1' }]);
    const out = await h.resolver.resolveArgs(OP, { tags: ['missing'] });
    expect(out.ok).toBe(false);
    if (out.ok) return;
    expect(out.error).toContain('No tag named "missing"');
    expect(out.error).toContain('cigchat_resolve');
  });

  it('caches a resolution instead of looking it up twice', async () => {
    const h = resolverWith([{ name: 'VIP', tag_ns: 'f9t9' }]);
    await h.resolver.resolveArgs(OP, { tags: ['VIP'] });
    const before = h.requests;
    await h.resolver.resolveArgs(OP, { tags: ['VIP'] });
    expect(h.requests).toBe(before);
  });

  it('lists a lookup resource as name/ns pairs', async () => {
    const h = resolverWith([{ name: 'VIP', tag_ns: 'f9t9' }]);
    expect(await h.resolver.list('tag')).toEqual([{ name: 'VIP', ns: 'f9t9' }]);
  });
});
