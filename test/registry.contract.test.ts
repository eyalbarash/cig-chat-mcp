/**
 * The contract test. Because tools are generated, this is the file that catches an upstream
 * spec change or an overrides edit altering the tool surface — loudly, with a readable diff.
 */

import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config.js';
import { ToolRegistry, allTools } from '../src/registry.js';
import { OPERATIONS } from '../src/generated/operations.js';
import { TIERS } from '../src/types.js';

const baseEnv = { CIGCHAT_API_TOKEN: 'test-token' } as NodeJS.ProcessEnv;

function registryFor(env: Partial<NodeJS.ProcessEnv>): ToolRegistry {
  return new ToolRegistry(loadConfig({ env: { ...baseEnv, ...env } }));
}

describe('tool registry invariants', () => {
  const tools = allTools();

  it('has unique tool names', () => {
    const names = tools.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('uses names every MCP client accepts', () => {
    for (const t of tools) {
      expect(t.name, `${t.name} must be snake_case ascii`).toMatch(/^[a-z][a-z0-9_]{0,63}$/);
      expect(t.name.length, `${t.name} exceeds 64 chars`).toBeLessThanOrEqual(64);
    }
  });

  it('gives every tool a toolset, a known tier and a real description', () => {
    for (const t of tools) {
      expect(t.toolset, `${t.name} has no toolset`).toBeTruthy();
      expect(TIERS, `${t.name} has an unknown tier`).toContain(t.tier);
      expect(t.description.length, `${t.name} description too short`).toBeGreaterThan(20);
    }
  });

  it('namespaces every tool under cigchat_', () => {
    for (const t of tools) expect(t.name.startsWith('cigchat_')).toBe(true);
  });

  it('names every fan-out tool so one deny rule covers the class', () => {
    const broadcasts = tools.filter((t) => t.tier === 'broadcast');
    expect(broadcasts.length).toBeGreaterThan(0);
    for (const t of broadcasts) expect(t.name.startsWith('cigchat_broadcast_')).toBe(true);

    const sends = OPERATIONS.filter((o) => o.tier === 'send' && o.path.includes('/send-'));
    for (const o of sends) expect(o.name.startsWith('cigchat_send_')).toBe(true);
  });

  it('warns the model in the description of every dangerous tool', () => {
    for (const t of tools) {
      if (t.tier === 'broadcast') expect(t.description).toContain('DANGEROUS');
      if (t.tier === 'destructive') expect(t.description).toContain('DESTRUCTIVE');
    }
  });

  it('accepts a confirm argument on every tool that needs approval', () => {
    for (const t of tools) {
      if (t.tier === 'broadcast' || t.tier === 'destructive') {
        expect(Object.keys(t.schema.shape), `${t.name} lacks confirm`).toContain('confirm');
      }
    }
  });
});

describe('toolset and tier filtering', () => {
  it('exposes everything by default', () => {
    const registry = registryFor({});
    expect(registry.active().length).toBe(allTools().length);
  });

  it('keeps core available even when a narrow toolset list is given', () => {
    const names = registryFor({ CIGCHAT_TOOLSETS: 'shop' })
      .active()
      .map((t) => t.name);
    expect(names).toContain('cigchat_whoami');
    expect(names).toContain('cigchat_list_toolsets');
    expect(names.some((n) => n.includes('shop'))).toBe(true);
    expect(names).not.toContain('cigchat_broadcast_by_tag');
  });

  it('drops every dangerous tool under a read-only allowance', () => {
    const active = registryFor({ CIGCHAT_ALLOW: 'read' }).active();
    expect(active.every((t) => t.tier === 'read')).toBe(true);
    expect(active.map((t) => t.name)).not.toContain('cigchat_broadcast_by_tag');
  });

  it('registers only core in dynamic mode, then grows on demand', () => {
    const registry = registryFor({ CIGCHAT_TOOLSETS: 'dynamic' });
    const before = registry.active();
    expect(before.every((t) => t.toolset === 'core')).toBe(true);

    expect(registry.enable('shop')).toBe(true);
    expect(registry.enable('not-a-toolset')).toBe(false);
    expect(registry.active().length).toBeGreaterThan(before.length);
  });

  it('reports toolsets with counts and enabled state', () => {
    const sets = registryFor({ CIGCHAT_TOOLSETS: 'shop' }).describeToolsets();
    expect(sets.find((s) => s.id === 'shop')?.enabled).toBe(true);
    expect(sets.find((s) => s.id === 'core')?.enabled).toBe(true);
    expect(sets.find((s) => s.id === 'messaging')?.enabled).toBe(false);
    for (const s of sets) expect(s.toolCount).toBeGreaterThan(0);
  });
});

describe('generated operation table', () => {
  it('covers the whole documented API surface', () => {
    expect(OPERATIONS.length).toBe(249);
  });

  it('gates broadcast cancel and delete behind the confirmation step', () => {
    const tierOf = (name: string): string | undefined =>
      OPERATIONS.find((o) => o.name === name)?.tier;
    expect(tierOf('cigchat_cancel_broadcast')).toBe('destructive');
    expect(tierOf('cigchat_delete_broadcast')).toBe('destructive');
    expect(tierOf('cigchat_list_broadcasts')).toBe('read');
    expect(tierOf('cigchat_team_ticket_item_comments')).toBe('read');
    expect(tierOf('cigchat_team_ticket_item_add_comment')).toBe('write');
  });

  it('can size the audience of every tag- or segment-targeted broadcast', () => {
    const needsEstimate = OPERATIONS.filter(
      (o) => o.tier === 'broadcast' && !/user_id|to_list/.test(o.name),
    );
    for (const o of needsEstimate) {
      expect(o.audienceFrom, `${o.name} cannot estimate its audience`).toBeTruthy();
    }
  });

  it('classifies the read-only POSTs as reads', () => {
    const readOnlyPosts = OPERATIONS.filter((o) => o.readOnly);
    expect(readOnlyPosts.length).toBe(5);
    for (const o of readOnlyPosts) expect(o.tier).toBe('read');
  });

  it('never marks a GET as dangerous', () => {
    for (const o of OPERATIONS) {
      if (o.method === 'GET') expect(o.tier).toBe('read');
    }
  });
});
