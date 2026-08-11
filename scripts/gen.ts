/**
 * Turns spec/openapi.json + spec/overrides.ts into:
 *   src/generated/operations.ts   the tool table the server registers
 *   src/generated/toolsets.ts     toolset metadata
 *   docs/TOOLS.md                 human tool reference
 *   docs/tools.json               machine data for www.cig.chat/mcp
 *
 * Output is committed. `pnpm gen` producing a diff IS the code review for an upstream change,
 * and a determinism test asserts the committed files match a fresh run.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { OperationSpec, ParamSpec, Tier } from '../src/types.js';
import {
  AUDIENCE_FROM,
  DENYLIST,
  NAME_OVERRIDES,
  NS_PARAMS,
  READ_ONLY_OPERATIONS,
  TAG_TO_TOOLSET,
  TIER_OVERRIDES,
  TOOLSETS,
} from '../spec/overrides.js';

const here = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(here, '..');
const SPEC = join(ROOT, 'spec', 'openapi.json');
const GEN_DIR = join(ROOT, 'src', 'generated');
const DOCS_DIR = join(ROOT, 'docs');

const METHODS = ['get', 'post', 'put', 'delete', 'patch'] as const;
type Method = (typeof METHODS)[number];

type Json = Record<string, any>;

const spec = JSON.parse(readFileSync(SPEC, 'utf8')) as Json;

/** Follows $ref chains; guards against cycles by depth. */
function deref(node: Json | undefined, depth = 0): Json {
  if (!node || depth > 12) return node ?? {};
  if (typeof node['$ref'] === 'string') {
    const parts = String(node['$ref']).replace(/^#\//, '').split('/');
    let target: Json = spec;
    for (const p of parts) target = target?.[p];
    return deref(target, depth + 1);
  }
  return node;
}

/** The spec embeds HTML and a scope banner in descriptions; strip both. */
function cleanDescription(raw: string | undefined): string {
  if (!raw) return '';
  return (
    raw
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      // The scope banner is re-emitted as a proper sentence at the end of the description.
      .replace(/Scope required:\s*\([^)]*\)/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

function scopeOf(raw: string | undefined): string | undefined {
  const m = /Scope required:\s*\(([^)]+)\)/i.exec(raw ?? '');
  return m?.[1]?.trim();
}

function jsonTypeOf(schema: Json): ParamSpec['type'] {
  const t = schema['type'];
  if (t === 'integer') return 'integer';
  if (t === 'number') return 'number';
  if (t === 'boolean') return 'boolean';
  if (t === 'array') return 'array';
  if (t === 'object') return 'object';
  if (t === 'string') return 'string';
  if (schema['properties']) return 'object';
  if (schema['items']) return 'array';
  return 'any';
}

function nsKindFor(name: string, path: string): string | undefined {
  if (name === 'var_ns') {
    // The same parameter name means two different things depending on the endpoint.
    return path.includes('bot-field') ? 'bot_field' : 'user_field';
  }
  return NS_PARAMS[name];
}

function buildParam(
  name: string,
  location: ParamSpec['in'],
  schema: Json,
  required: boolean,
  path: string,
  description?: string,
  depth = 0,
): ParamSpec {
  const s = deref(schema);
  const type = jsonTypeOf(s);
  const desc = cleanDescription(description ?? s['description']);
  const example = s['example'] !== undefined ? String(s['example']) : undefined;
  const kind = nsKindFor(name, path);

  const param: ParamSpec = { name, in: location, type };
  if (required) param.required = true;
  if (desc) param.description = desc;
  if (Array.isArray(s['enum'])) param.enum = s['enum'].map(String);
  if (example !== undefined) param.example = example;
  if (kind) param.nsKind = kind;

  if (type === 'array' && depth < 5) {
    const items = deref(s['items']);
    if (items && Object.keys(items).length > 0) {
      // Array items inherit the parent's ns kind (e.g. `tags: [tag_ns, ...]`).
      const child = buildParam(`${name}_item`, location, items, false, path, undefined, depth + 1);
      if (kind && child.type === 'string') child.nsKind = kind;
      param.items = child;
    }
  }
  if (type === 'object' && depth < 5) {
    const props = (s['properties'] ?? {}) as Json;
    const req = new Set<string>(Array.isArray(s['required']) ? s['required'] : []);
    const children = Object.entries(props).map(([k, v]) =>
      buildParam(k, location, v as Json, req.has(k), path, undefined, depth + 1),
    );
    if (children.length > 0) param.properties = children;
  }
  return param;
}

function deriveTier(method: Method, operationId: string): Tier {
  const override = TIER_OVERRIDES[operationId];
  if (override) return override;
  if (READ_ONLY_OPERATIONS.has(operationId)) return 'read';
  if (method === 'get') return 'read';
  if (method === 'delete') return 'destructive';
  return 'write';
}

function slugFromPath(path: string): string {
  return path
    .replace(/\{[^}]+\}/g, '')
    .split('/')
    .filter(Boolean)
    .join('_')
    .replace(/-/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/** Verb used when several methods share one path. */
function methodVerb(method: Method, path: string): string {
  if (path.startsWith('/integration/')) {
    return method === 'get' ? 'get' : method === 'delete' ? 'clear' : 'set';
  }
  return { get: 'get', post: 'create', put: 'update', delete: 'delete', patch: 'update' }[method];
}

type Collected = {
  method: Method;
  path: string;
  operationId: string;
  tag: string;
  raw: Json;
};

const collected: Collected[] = [];
for (const [path, item] of Object.entries(spec['paths'] as Json)) {
  for (const method of METHODS) {
    const op = (item as Json)[method] as Json | undefined;
    if (!op) continue;
    const operationId = String(op['operationId'] ?? '');
    if (!operationId) throw new Error(`Missing operationId for ${method.toUpperCase()} ${path}`);
    if (DENYLIST.has(operationId)) continue;
    collected.push({
      method,
      path,
      operationId,
      tag: String((op['tags'] ?? [])[0] ?? ''),
      raw: op,
    });
  }
}

// An override keyed on a misspelled operationId is silently ignored, which is how a
// read-only POST ends up classified as a write. Fail loudly instead.
const knownIds = new Set(collected.map((c) => c.operationId));
const danglingOverrides: string[] = [];
for (const [label, ids] of [
  ['READ_ONLY_OPERATIONS', [...READ_ONLY_OPERATIONS]],
  ['TIER_OVERRIDES', Object.keys(TIER_OVERRIDES)],
  ['AUDIENCE_FROM', Object.keys(AUDIENCE_FROM)],
  ['NAME_OVERRIDES', Object.keys(NAME_OVERRIDES)],
] as const) {
  for (const id of ids) {
    if (!knownIds.has(id)) danglingOverrides.push(`  ${label}: "${id}" matches no operationId`);
  }
}
if (danglingOverrides.length > 0) {
  throw new Error(
    `${danglingOverrides.length} override(s) reference an unknown operationId. ` +
      `Fix the spelling in spec/overrides.ts:\n${danglingOverrides.join('\n')}`,
  );
}

// A path with more than one method needs a verb to disambiguate its tools.
const methodsPerPath = new Map<string, number>();
for (const c of collected) methodsPerPath.set(c.path, (methodsPerPath.get(c.path) ?? 0) + 1);

const operations: OperationSpec[] = [];
const seenNames = new Map<string, string>();
const collisions: string[] = [];

for (const c of collected) {
  const toolset = TAG_TO_TOOLSET[c.tag];
  if (!toolset) {
    throw new Error(
      `Tag "${c.tag}" (${c.operationId}) has no toolset. Add it to TAG_TO_TOOLSET in spec/overrides.ts.`,
    );
  }

  const tier = deriveTier(c.method, c.operationId);
  const rawDesc = String(c.raw['description'] ?? c.raw['summary'] ?? '');
  const scope = scopeOf(rawDesc);

  let name = NAME_OVERRIDES[c.operationId];
  if (!name) {
    const needsVerb = (methodsPerPath.get(c.path) ?? 0) > 1;
    const slug = slugFromPath(c.path);
    name = `cigchat_${needsVerb ? `${methodVerb(c.method, c.path)}_${slug}` : slug}`;
  }
  name = name.replace(/_+/g, '_').slice(0, 64);
  const clash = seenNames.get(name);
  if (clash) {
    collisions.push(
      `  "${name}" ← ${clash} AND ${c.operationId} (${c.method.toUpperCase()} ${c.path})`,
    );
  }
  seenNames.set(name, c.operationId);

  // Parameters: path + query first, then flattened request-body properties.
  const params: ParamSpec[] = [];
  for (const p of (c.raw['parameters'] ?? []) as Json[]) {
    const pd = deref(p);
    const location = pd['in'] === 'path' ? 'path' : 'query';
    if (pd['in'] !== 'path' && pd['in'] !== 'query') continue;
    params.push(
      buildParam(
        String(pd['name']),
        location,
        deref(pd['schema']) ?? {},
        Boolean(pd['required']),
        c.path,
        pd['description'],
      ),
    );
  }
  const bodySchema = deref(
    deref(c.raw['requestBody'])?.['content']?.['application/json']?.['schema'],
  );
  if (bodySchema && bodySchema['properties']) {
    const req = new Set<string>(
      Array.isArray(bodySchema['required']) ? bodySchema['required'] : [],
    );
    for (const [k, v] of Object.entries(bodySchema['properties'] as Json)) {
      params.push(buildParam(k, 'body', v as Json, req.has(k), c.path));
    }
  }

  const descParts = [
    cleanDescription(rawDesc) || `${c.method.toUpperCase()} ${c.path}`,
    `[${c.method.toUpperCase()} ${c.path}]`,
  ];
  if (tier === 'broadcast') {
    descParts.push(
      'DANGEROUS: sends to many subscribers at once, costs money and cannot be undone. ' +
        'Call once without `confirm` to get an audience estimate, show it to the human, ' +
        'and only then re-call with the confirmation token.',
    );
  } else if (tier === 'send') {
    descParts.push('Delivers a real message to a person.');
  } else if (tier === 'destructive') {
    descParts.push(
      'DESTRUCTIVE: irreversible. Call once without `confirm` to get an impact statement first.',
    );
  }
  if (scope) descParts.push(`Requires the "${scope}" scope on the token.`);

  const operation: OperationSpec = {
    name,
    description: descParts.join(' '),
    toolset,
    tier,
    method: c.method.toUpperCase() as OperationSpec['method'],
    path: c.path,
    params,
    operationId: c.operationId,
  };
  if (READ_ONLY_OPERATIONS.has(c.operationId)) operation.readOnly = true;
  const audience = AUDIENCE_FROM[c.operationId];
  if (audience) operation.audienceFrom = audience;

  operations.push(operation);
}

if (collisions.length > 0) {
  throw new Error(
    `${collisions.length} tool-name collision(s). Add NAME_OVERRIDES entries in spec/overrides.ts:\n` +
      collisions.join('\n'),
  );
}

operations.sort((a, b) => a.name.localeCompare(b.name));

// ---------------------------------------------------------------- emit

mkdirSync(GEN_DIR, { recursive: true });
mkdirSync(DOCS_DIR, { recursive: true });

const HEADER = `// GENERATED BY scripts/gen.ts — DO NOT EDIT BY HAND.
// Run \`pnpm gen\` after changing spec/openapi.json or spec/overrides.ts.
`;

writeFileSync(
  join(GEN_DIR, 'operations.ts'),
  `${HEADER}
import type { OperationSpec } from '../types.js';

export const OPERATIONS: OperationSpec[] = ${JSON.stringify(operations, null, 2)};
`,
);

writeFileSync(
  join(GEN_DIR, 'toolsets.ts'),
  `${HEADER}
export const TOOLSET_META: { id: string; label: string; labelHe: string; description: string }[] =
  ${JSON.stringify(TOOLSETS, null, 2)};
`,
);

// ---------------------------------------------------------------- docs

const byToolset = new Map<string, OperationSpec[]>();
for (const op of operations) {
  const list = byToolset.get(op.toolset) ?? [];
  list.push(op);
  byToolset.set(op.toolset, list);
}

const tierCount = (t: Tier): number => operations.filter((o) => o.tier === t).length;

const md: string[] = [
  '# Tool reference',
  '',
  '_Generated from the cig.chat OpenAPI spec — do not edit by hand._',
  '',
  `**${operations.length} tools** across **${byToolset.size} toolsets**, wrapping ` +
    `${operations.length} API operations.`,
  '',
  '| Tier | Tools | Meaning |',
  '| --- | ---: | --- |',
  `| \`read\` | ${tierCount('read')} | Reads data. No state change. |`,
  `| \`write\` | ${tierCount('write')} | Reversible change. |`,
  `| \`send\` | ${tierCount('send')} | Delivers a message to one person. |`,
  `| \`broadcast\` | ${tierCount('broadcast')} | Delivers to many. Confirmation required. |`,
  `| \`destructive\` | ${tierCount('destructive')} | Irreversible. Confirmation required. |`,
  '',
];

for (const meta of TOOLSETS) {
  const list = byToolset.get(meta.id);
  if (!list?.length) continue;
  md.push(`## ${meta.label} — \`${meta.id}\` (${list.length})`, '', meta.description, '');
  md.push('| Tool | Tier | Endpoint | Description |');
  md.push('| --- | --- | --- | --- |');
  for (const op of list) {
    const short = op.description.split('[')[0]!.trim().slice(0, 140);
    md.push(`| \`${op.name}\` | ${op.tier} | \`${op.method} ${op.path}\` | ${short} |`);
  }
  md.push('');
}
writeFileSync(join(DOCS_DIR, 'TOOLS.md'), `${md.join('\n')}\n`);

const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as Json;
writeFileSync(
  join(DOCS_DIR, 'tools.json'),
  `${JSON.stringify(
    {
      package: pkg['name'],
      version: pkg['version'],
      counts: {
        tools: operations.length,
        toolsets: byToolset.size,
        endpoints: operations.length,
        byTier: {
          read: tierCount('read'),
          write: tierCount('write'),
          send: tierCount('send'),
          broadcast: tierCount('broadcast'),
          destructive: tierCount('destructive'),
        },
      },
      toolsets: TOOLSETS.filter((t) => byToolset.has(t.id)).map((t) => ({
        ...t,
        toolCount: byToolset.get(t.id)?.length ?? 0,
      })),
      tools: operations.map((o) => ({
        name: o.name,
        toolset: o.toolset,
        tier: o.tier,
        endpoint: `${o.method} ${o.path}`,
        description: o.description.split('[')[0]!.trim(),
      })),
    },
    null,
    2,
  )}\n`,
);

process.stderr.write(
  `Generated ${operations.length} tools across ${byToolset.size} toolsets\n` +
    `  read ${tierCount('read')} · write ${tierCount('write')} · send ${tierCount('send')} · ` +
    `broadcast ${tierCount('broadcast')} · destructive ${tierCount('destructive')}\n`,
);
