/**
 * The only test that proves the published artifact actually speaks MCP.
 * Spawns the built binary and performs a real initialize + tools/list handshake.
 */

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const CLI = join(ROOT, 'dist', 'cli.js');

type RpcResponse = { id?: number; result?: Record<string, unknown>; error?: unknown };

/** Sends a batch of JSON-RPC messages over stdio and collects the responses. */
function handshake(messages: unknown[]): Promise<RpcResponse[]> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [CLI], {
      env: { ...process.env, CIGCHAT_API_TOKEN: 'test-token-not-used-offline' },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const out: RpcResponse[] = [];
    let buffer = '';
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`timed out; got ${out.length} responses`));
    }, 20_000);

    child.stdout.on('data', (chunk: Buffer) => {
      buffer += chunk.toString();
      let nl: number;
      while ((nl = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, nl).trim();
        buffer = buffer.slice(nl + 1);
        if (!line) continue;
        try {
          out.push(JSON.parse(line) as RpcResponse);
        } catch {
          // Ignore any non-JSON diagnostics.
        }
        if (out.length === messages.filter((m) => (m as { id?: number }).id !== undefined).length) {
          clearTimeout(timer);
          child.kill();
          resolve(out);
        }
      }
    });
    child.on('error', reject);

    for (const m of messages) child.stdin.write(`${JSON.stringify(m)}\n`);
  });
}

describe.skipIf(!existsSync(CLI))('stdio transport', () => {
  it('completes an MCP handshake and lists tools', async () => {
    const responses = await handshake([
      {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-06-18',
          capabilities: {},
          clientInfo: { name: 'contract-test', version: '0' },
        },
      },
      { jsonrpc: '2.0', method: 'notifications/initialized' },
      { jsonrpc: '2.0', id: 2, method: 'tools/list' },
    ]);

    const init = responses.find((r) => r.id === 1);
    expect(init?.result).toBeDefined();
    expect((init!.result as { serverInfo: { name: string } }).serverInfo.name).toBe('cigchat');

    const list = responses.find((r) => r.id === 2);
    const tools = (list!.result as { tools: { name: string; description: string }[] }).tools;
    expect(tools.length).toBeGreaterThan(200);
    expect(tools.map((t) => t.name)).toContain('cigchat_whoami');
    expect(tools.map((t) => t.name)).toContain('cigchat_broadcast_by_tag');
    for (const t of tools) expect(t.description.length).toBeGreaterThan(0);
  });
});
