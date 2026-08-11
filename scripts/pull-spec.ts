/**
 * Fetches the live cig.chat OpenAPI document and vendors a normalised copy into
 * spec/openapi.json.
 *
 * Vendoring rather than fetching at build time means codegen is deterministic, offline, and
 * every upstream change shows up as a reviewable diff instead of a surprise.
 */

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SPEC_URL = process.env.CIGCHAT_SPEC_URL ?? 'https://app.cig.chat/api-docs';
const here = fileURLToPath(new URL('.', import.meta.url));
const OUT = join(here, '..', 'spec', 'openapi.json');

/** Sorts keys recursively so an upstream reordering never shows up as a diff. */
function sortDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      out[key] = sortDeep((value as Record<string, unknown>)[key]);
    }
    return out;
  }
  return value;
}

async function main(): Promise<void> {
  process.stderr.write(`Fetching ${SPEC_URL}\n`);
  const res = await fetch(SPEC_URL, {
    headers: { Accept: 'application/json', 'User-Agent': '@cig-chat/mcp spec-pull' },
  });
  if (!res.ok) throw new Error(`Spec fetch failed: HTTP ${res.status} ${res.statusText}`);

  const spec = (await res.json()) as { openapi?: string; paths?: Record<string, unknown> };
  if (!spec.openapi || !spec.paths) throw new Error('Response is not an OpenAPI document.');

  const paths = Object.keys(spec.paths).length;
  const ops = Object.values(spec.paths).reduce<number>(
    (n, item) =>
      n +
      Object.keys(item as Record<string, unknown>).filter((m) =>
        ['get', 'post', 'put', 'delete', 'patch'].includes(m),
      ).length,
    0,
  );

  writeFileSync(OUT, `${JSON.stringify(sortDeep(spec), null, 2)}\n`);
  process.stderr.write(
    `Wrote ${OUT}\n  OpenAPI ${spec.openapi} · ${paths} paths · ${ops} operations\n`,
  );
  process.stderr.write('Now run `pnpm gen` and review the diff in src/generated/.\n');
}

main().catch((err: unknown) => {
  process.stderr.write(`spec:pull failed: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
