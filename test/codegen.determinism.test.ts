/**
 * Makes "did you forget to run `pnpm gen`?" impossible to miss in review.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

const GENERATED = [
  'src/generated/operations.ts',
  'src/generated/toolsets.ts',
  'docs/TOOLS.md',
  'docs/tools.json',
];

describe('codegen', () => {
  it('produces exactly what is committed', () => {
    const before = GENERATED.map((f) => readFileSync(join(ROOT, f), 'utf8'));

    execFileSync('npx', ['tsx', 'scripts/gen.ts'], { cwd: ROOT, stdio: 'pipe' });

    const after = GENERATED.map((f) => readFileSync(join(ROOT, f), 'utf8'));
    GENERATED.forEach((file, i) => {
      expect(after[i], `${file} is stale — run \`npm run gen\` and commit the result`).toBe(
        before[i],
      );
    });
  });

  it('keeps docs/tools.json in step with the operation table', async () => {
    const toolsJson = JSON.parse(readFileSync(join(ROOT, 'docs/tools.json'), 'utf8')) as {
      counts: { tools: number };
      tools: { name: string }[];
    };
    const { OPERATIONS } = await import('../src/generated/operations.js');
    expect(toolsJson.counts.tools).toBe(OPERATIONS.length);
    expect(toolsJson.tools.length).toBe(OPERATIONS.length);
  });
});
