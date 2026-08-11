/**
 * Exercises the built binary the way a person actually uses it — including piping into
 * `head`, which closes stdout early and used to crash the process with EPIPE.
 */

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const CLI = join(ROOT, 'dist', 'cli.js');

const run = (args: string, opts: { env?: Record<string, string> } = {}): string =>
  execSync(`node ${JSON.stringify(CLI)} ${args}`, {
    encoding: 'utf8',
    env: { ...process.env, ...opts.env },
    shell: '/bin/bash',
  });

describe.skipIf(!existsSync(CLI))('cli', () => {
  it('prints its version', () => {
    expect(run('--version').trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('documents the token requirement in --help', () => {
    const help = run('--help');
    expect(help).toContain('CIGCHAT_API_TOKEN');
    expect(help).toContain('one bot');
  });

  it('lists tools without a token, so setup can be inspected first', () => {
    expect(run('--list-tools')).toContain('cigchat_whoami');
  });

  it('survives a closed pipe instead of dying with EPIPE', () => {
    // The failure mode this guards: `--list-tools | head` exiting non-zero.
    const out = execSync(`node ${JSON.stringify(CLI)} --list-tools | head -3`, {
      encoding: 'utf8',
      shell: '/bin/bash',
    });
    expect(out.split('\n').length).toBeLessThanOrEqual(4);
    expect(out).toContain('tools active');
  });

  it('refuses to start without a token, and says how to get one', () => {
    let message = '';
    try {
      execSync(`node ${JSON.stringify(CLI)} --check`, {
        encoding: 'utf8',
        env: { ...process.env, CIGCHAT_API_TOKEN: '' },
        stdio: 'pipe',
      });
    } catch (err) {
      message = String((err as { stderr?: string }).stderr ?? '');
    }
    expect(message).toContain('CIGCHAT_API_TOKEN');
    expect(message).toContain('Settings');
  });
});
