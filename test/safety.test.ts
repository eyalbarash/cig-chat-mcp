import { describe, expect, it, vi } from 'vitest';
import { SafetyGate } from '../src/safety.js';
import { loadConfig } from '../src/config.js';
import { CigChatClient } from '../src/client.js';
import type { OperationSpec } from '../src/types.js';

const BROADCAST: OperationSpec = {
  name: 'cigchat_broadcast_by_tag',
  description: 'test',
  toolset: 'messaging',
  tier: 'broadcast',
  method: 'POST',
  path: '/subscriber/broadcast-by-tag',
  params: [],
  audienceFrom: 'tags',
  operationId: 'flowBotUserBroadcastByTag',
};

const DELETE_OP: OperationSpec = { ...BROADCAST, name: 'cigchat_delete_x', tier: 'destructive' };
const WRITE_OP: OperationSpec = { ...BROADCAST, name: 'cigchat_write_x', tier: 'write' };

function gate(env: Partial<NodeJS.ProcessEnv> = {}, audience = 0): SafetyGate {
  const config = loadConfig({
    env: { CIGCHAT_API_TOKEN: 't', CIGCHAT_RPS: '1000', ...env } as NodeJS.ProcessEnv,
  });
  const client = new CigChatClient(config, vi.fn() as unknown as typeof fetch);
  vi.spyOn(client, 'estimateAudience').mockResolvedValue({ count: audience, exact: true });
  return new SafetyGate(config, client);
}

describe('confirmation flow', () => {
  it('lets reversible writes straight through', async () => {
    const outcome = await gate().check(WRITE_OP, { a: 1 }, undefined);
    expect(outcome.allowed).toBe(true);
  });

  it('stops a broadcast and hands back an impact statement plus a token', async () => {
    const outcome = await gate({}, 4812).check(BROADCAST, { tags: ['f1t1'] }, undefined);
    expect(outcome.allowed).toBe(false);
    if (outcome.allowed) return;

    expect(outcome.result.requires_confirmation).toBe(true);
    expect(outcome.result.confirmation_token).toMatch(/^cfm_[0-9a-f]{24}$/);
    expect(outcome.result.audience_estimate).toEqual({ count: 4812, exact: true });
    expect(outcome.result.impact).toContain('4,812');
    expect(outcome.result.impact).toContain('cannot be undone');
    expect(outcome.result.next_step).toContain('Do not approve on their behalf');
  });

  it('proceeds when the token comes back with identical arguments', async () => {
    const g = gate({}, 10);
    const first = await g.check(BROADCAST, { tags: ['f1t1'] }, undefined);
    if (first.allowed) throw new Error('expected a challenge');
    const token = first.result.confirmation_token!;

    const second = await g.check(BROADCAST, { tags: ['f1t1'] }, token);
    expect(second.allowed).toBe(true);
  });

  it('rejects a token approved for a different audience', async () => {
    const g = gate({}, 10);
    const first = await g.check(BROADCAST, { tags: ['test-group'] }, undefined);
    if (first.allowed) throw new Error('expected a challenge');
    const token = first.result.confirmation_token!;

    const replay = await g.check(BROADCAST, { tags: ['everyone'] }, token);
    expect(replay.allowed).toBe(false);
    if (replay.allowed) return;
    expect(replay.result.error).toContain('does not match these arguments');
  });

  it('treats argument order as irrelevant', async () => {
    const g = gate({}, 10);
    const first = await g.check(BROADCAST, { a: 1, b: 2 }, undefined);
    if (first.allowed) throw new Error('expected a challenge');
    const second = await g.check(BROADCAST, { b: 2, a: 1 }, first.result.confirmation_token);
    expect(second.allowed).toBe(true);
  });

  it('burns the token after one use', async () => {
    const g = gate({}, 10);
    const first = await g.check(BROADCAST, { tags: ['f1t1'] }, undefined);
    if (first.allowed) throw new Error('expected a challenge');
    const token = first.result.confirmation_token!;

    expect((await g.check(BROADCAST, { tags: ['f1t1'] }, token)).allowed).toBe(true);
    const reuse = await g.check(BROADCAST, { tags: ['f1t1'] }, token);
    expect(reuse.allowed).toBe(false);
  });

  it('rejects an invented token', async () => {
    const outcome = await gate().check(BROADCAST, {}, 'cfm_deadbeef');
    expect(outcome.allowed).toBe(false);
    if (outcome.allowed) return;
    expect(outcome.result.error).toContain('unknown or already used');
  });

  it('guards destructive operations too', async () => {
    const outcome = await gate().check(DELETE_OP, { id: 1 }, undefined);
    expect(outcome.allowed).toBe(false);
    if (outcome.allowed) return;
    expect(outcome.result.impact).toContain('irreversible');
  });
});

describe('recipient cap', () => {
  it('refuses outright above the cap, with no token offered', async () => {
    const outcome = await gate({ CIGCHAT_MAX_BROADCAST_RECIPIENTS: '100' }, 5000).check(
      BROADCAST,
      { tags: ['f1t1'] },
      undefined,
    );
    expect(outcome.allowed).toBe(false);
    if (outcome.allowed) return;
    expect(outcome.result.confirmation_token).toBeUndefined();
    expect(outcome.result.error).toContain('CIGCHAT_MAX_BROADCAST_RECIPIENTS');
  });

  it('treats 0 as no cap', async () => {
    const outcome = await gate({ CIGCHAT_MAX_BROADCAST_RECIPIENTS: '0' }, 999_999).check(
      BROADCAST,
      { tags: ['f1t1'] },
      undefined,
    );
    if (outcome.allowed) throw new Error('expected a challenge');
    expect(outcome.result.requires_confirmation).toBe(true);
  });
});

describe('exact recipient lists', () => {
  it('counts an explicit list without calling the API', async () => {
    // broadcast-to-list names its recipients outright, so there is nothing to estimate.
    const { audienceFrom: _omitted, ...toList } = BROADCAST;
    const outcome = await gate({}, 0).check(
      { ...toList, name: 'cigchat_broadcast_to_list' },
      { user_ns_list: ['a', 'b', 'c'] },
      undefined,
    );
    if (outcome.allowed) throw new Error('expected a challenge');
    expect(outcome.result.audience_estimate).toEqual({ count: 3, exact: true });
  });
});

describe('configurable confirmation tiers', () => {
  it('can be turned off entirely', async () => {
    const outcome = await gate({ CIGCHAT_CONFIRM_TIERS: 'none' }).check(BROADCAST, {}, undefined);
    expect(outcome.allowed).toBe(true);
  });
});
