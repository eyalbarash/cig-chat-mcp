import { describe, expect, it, vi } from 'vitest';
import { CigChatClient, redact, scrub } from '../src/client.js';
import { loadConfig } from '../src/config.js';

const TOKEN = 'super-secret-token-value';

function makeClient(
  responses: (Response | (() => Response))[],
  env: Partial<NodeJS.ProcessEnv> = {},
): { client: CigChatClient; calls: { url: string; init: RequestInit }[] } {
  const calls: { url: string; init: RequestInit }[] = [];
  let i = 0;
  const fetchImpl = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    const next = responses[Math.min(i++, responses.length - 1)]!;
    return typeof next === 'function' ? next() : next;
  }) as unknown as typeof fetch;

  const config = loadConfig({
    env: { CIGCHAT_API_TOKEN: TOKEN, CIGCHAT_RPS: '1000', ...env } as NodeJS.ProcessEnv,
  });
  return { client: new CigChatClient(config, fetchImpl), calls };
}

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

describe('request shaping', () => {
  it('sends bearer auth and JSON negotiation, even on GET', async () => {
    const { client, calls } = makeClient([json({ data: [] })]);
    await client.request({ method: 'GET', path: '/flow/tags', query: { limit: 10 } });

    const headers = calls[0]!.init.headers as Record<string, string>;
    expect(headers['Authorization']).toBe(`Bearer ${TOKEN}`);
    expect(headers['Accept']).toBe('application/json');
    expect(headers['Content-Type']).toBe('application/json');
    expect(calls[0]!.url).toBe('https://app.cig.chat/api/flow/tags?limit=10');
  });

  it('omits empty query values and expands arrays', async () => {
    const { client, calls } = makeClient([json({})]);
    await client.request({
      method: 'GET',
      path: '/subscribers',
      query: { name: '', page: 2, tags: ['a', 'b'] },
    });
    expect(calls[0]!.url).toContain('page=2');
    expect(calls[0]!.url).not.toContain('name=');
    expect(calls[0]!.url).toContain('tags%5B%5D=a');
  });
});

describe('never leaking the token', () => {
  it('keeps the token out of error messages', async () => {
    const { client } = makeClient([
      new Response(`denied for Bearer ${TOKEN}`, { status: 403, statusText: 'Forbidden' }),
    ]);
    const res = await client.request({ method: 'GET', path: '/me' });
    expect(res.ok).toBe(false);
    expect(res.error).not.toContain(TOKEN);
    expect(res.error).toContain('Bearer ***');
  });

  it('masks credential-shaped fields in responses', () => {
    const masked = redact({ api_key: 'sk-abcdefghijklmnop', nested: { password: 'hunter2xyz' } });
    expect(JSON.stringify(masked)).not.toContain('abcdefghij');
    expect((masked as Record<string, string>)['api_key']).toBe('***mnop');
  });

  it('scrubs token-shaped strings out of free text', () => {
    expect(scrub('key sk-1234567890abcdef here')).toContain('sk-***');
    expect(scrub('id 0123456789abcdef0123456789abcdef')).toContain('***');
  });
});

describe('dry run', () => {
  it('never reaches the network for a write, and echoes the request', async () => {
    const { client, calls } = makeClient([json({})], { CIGCHAT_DRY_RUN: 'true' });
    const res = await client.request({
      method: 'POST',
      path: '/subscriber/add-tag',
      body: { user_ns: 'f1u1', tag_ns: 'f1t1' },
      tier: 'write',
    });
    expect(calls.length).toBe(0);
    expect(res.dry_run).toBe(true);
    expect(res.would_call).toMatchObject({ method: 'POST' });
  });

  it('still performs reads', async () => {
    const { client, calls } = makeClient([json({ data: [] })], { CIGCHAT_DRY_RUN: 'true' });
    const res = await client.request({ method: 'GET', path: '/flow/tags' });
    expect(calls.length).toBe(1);
    expect(res.dry_run).toBeUndefined();
  });
});

describe('error normalisation', () => {
  it.each([
    [{ message: 'bad input' }, 'bad input'],
    [{ error: 'other shape' }, 'other shape'],
  ])('reads both documented error shapes', async (body, expected) => {
    const { client } = makeClient([json(body, 400)]);
    const res = await client.request({ method: 'GET', path: '/x' });
    expect(res.error).toContain(expected);
  });

  it('explains a 401 in terms of the bot token', async () => {
    const { client } = makeClient([json({ message: 'Unauthenticated' }, 401)]);
    const res = await client.request({ method: 'GET', path: '/me' });
    expect(res.error).toContain('bot-scoped');
  });

  it('explains the array-of-objects cause of a 422', async () => {
    const { client } = makeClient([json({ message: 'The data.0.tag_ns field is required' }, 422)]);
    const res = await client.request({ method: 'POST', path: '/subscriber/add-tags' });
    expect(res.error).toContain('array of objects');
  });

  it('recognises an HTML error page as a routing problem', async () => {
    const { client } = makeClient([
      new Response('<!doctype html><html>Not Found</html>', { status: 404 }),
    ]);
    const res = await client.request({ method: 'GET', path: '/nope' });
    expect(res.error).toContain('HTML error page');
  });

  it('caps the error snippet so a huge body cannot flood context', async () => {
    const { client } = makeClient([new Response('x'.repeat(5000), { status: 500 })]);
    const res = await client.request({ method: 'GET', path: '/x' });
    expect(res.error!.length).toBeLessThan(700);
  });
});

describe('retry policy', () => {
  it('retries a rate-limited GET and succeeds', async () => {
    const { client, calls } = makeClient([
      json({ message: 'slow down' }, 429),
      json({ data: ['ok'] }),
    ]);
    const res = await client.request({ method: 'GET', path: '/flow/tags' });
    expect(calls.length).toBe(2);
    expect(res.ok).toBe(true);
  });

  it('refuses to retry a broadcast, because it may already have sent', async () => {
    const { client, calls } = makeClient([json({ message: 'slow down' }, 429)]);
    const res = await client.request({
      method: 'POST',
      path: '/subscriber/broadcast-by-tag',
      tier: 'broadcast',
    });
    expect(calls.length).toBe(1);
    expect(res.ok).toBe(false);
    expect(res.retryable).toBe(true);
    expect(res.error).toContain('deliver them twice');
  });

  it('refuses to retry a 1:1 send for the same reason', async () => {
    const { client, calls } = makeClient([json({}, 503)]);
    await client.request({ method: 'POST', path: '/subscriber/send-text', tier: 'send' });
    expect(calls.length).toBe(1);
  });

  it('does retry a read-only POST', async () => {
    const { client, calls } = makeClient([json({}, 429), json({ data: [] })]);
    const res = await client.request({
      method: 'POST',
      path: '/whatsapp-template/list',
      tier: 'read',
      readOnly: true,
    });
    expect(calls.length).toBe(2);
    expect(res.ok).toBe(true);
  });
});

describe('audience estimation', () => {
  it('counts across pages and reports an exact total on a short page', async () => {
    const full = Array.from({ length: 100 }, (_, i) => ({ id: i }));
    const { client } = makeClient([json({ data: full }), json({ data: [{ id: 999 }] })]);
    const res = await client.estimateAudience({ tag_ns: 'f1t1' });
    expect(res).toEqual({ count: 101, exact: true });
  });
});
