/**
 * Runtime configuration, read once from the environment.
 *
 * The cig.chat API token belongs to the CUSTOMER. It is supplied at runtime via
 * CIGCHAT_API_TOKEN and is never defaulted, bundled, logged or echoed. One token
 * is scoped to exactly one bot.
 */

import { TIERS } from './types.js';
import type { Tier } from './types.js';

export type { Tier };
export { TIERS };

export const DEFAULT_BASE_URL = 'https://app.cig.chat/api';

export type Config = {
  apiToken: string;
  baseUrl: string;
  /** `'all'`, `'dynamic'`, or an explicit list of toolset ids. */
  toolsets: 'all' | 'dynamic' | string[];
  /** Which risk tiers may be registered at all. */
  allow: Tier[];
  /** Tiers that require a two-phase `confirm` token before they execute. */
  confirmTiers: Tier[];
  /** When true, mutating calls never reach the network; they echo what they would send. */
  dryRun: boolean;
  /** Hard ceiling on broadcast audience. 0 = no cap. */
  maxBroadcastRecipients: number;
  /** Client-side request rate limit. */
  rps: number;
  maxRetries: number;
  /** Responses longer than this are truncated with a hint to paginate. */
  maxResponseChars: number;
};

function parseList(raw: string | undefined): string[] | undefined {
  if (raw === undefined) return undefined;
  const items = raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return items.length > 0 ? items : undefined;
}

function parseTiers(raw: string | undefined, fallback: Tier[]): Tier[] {
  const items = parseList(raw);
  if (!items) return fallback;
  if (items.includes('all')) return [...TIERS];
  if (items.includes('none')) return [];
  const known = items.filter((i): i is Tier => (TIERS as readonly string[]).includes(i));
  const unknown = items.filter((i) => !(TIERS as readonly string[]).includes(i));
  if (unknown.length > 0) {
    throw new Error(
      `Unknown risk tier(s): ${unknown.join(', ')}. Valid tiers: ${TIERS.join(', ')}, or "all"/"none".`,
    );
  }
  return known;
}

function parseInt_(raw: string | undefined, fallback: number, name: string): number {
  if (raw === undefined || raw.trim() === '') return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error(`${name} must be a non-negative number, got: ${raw}`);
  }
  return Math.floor(n);
}

/** `true` unless explicitly set to a falsy string — used for fail-safe-on flags. */
function boolDefaultTrue(raw: string | undefined): boolean {
  if (raw === undefined) return true;
  return !['false', '0', 'no', 'off'].includes(raw.trim().toLowerCase());
}

/** `false` unless explicitly set to a truthy string — used for fail-safe-off flags. */
function boolDefaultFalse(raw: string | undefined): boolean {
  if (raw === undefined) return false;
  return ['true', '1', 'yes', 'on'].includes(raw.trim().toLowerCase());
}

export type LoadConfigOptions = {
  /** Overrides the env token — used by the HTTP transport, which reads it per request. */
  apiToken?: string;
  env?: NodeJS.ProcessEnv;
  /** Skip the token requirement (for `--list-tools`, docs generation and tests). */
  requireToken?: boolean;
};

export function loadConfig(opts: LoadConfigOptions = {}): Config {
  const env = opts.env ?? process.env;
  const requireToken = opts.requireToken ?? true;

  const apiToken = opts.apiToken ?? env.CIGCHAT_API_TOKEN ?? '';
  if (requireToken && !apiToken) {
    throw new Error(
      'CIGCHAT_API_TOKEN is not set.\n' +
        'This server needs YOUR cig.chat bot token — it does not ship with one.\n' +
        'Get it from cig.chat → your bot → Settings → API, then set CIGCHAT_API_TOKEN.\n' +
        'One token controls exactly one bot. See https://www.cig.chat/mcp for setup.',
    );
  }

  const rawToolsets = env.CIGCHAT_TOOLSETS?.trim().toLowerCase();
  let toolsets: Config['toolsets'];
  if (!rawToolsets || rawToolsets === 'all') toolsets = 'all';
  else if (rawToolsets === 'dynamic') toolsets = 'dynamic';
  else toolsets = parseList(rawToolsets) ?? 'all';

  return {
    apiToken,
    baseUrl: (env.CIGCHAT_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, ''),
    toolsets,
    // Every tool is available by default; the confirmation flow is the guardrail.
    allow: parseTiers(env.CIGCHAT_ALLOW, [...TIERS]),
    // Irreversible fan-out and data loss need a human-visible confirmation step.
    confirmTiers: parseTiers(env.CIGCHAT_CONFIRM_TIERS, ['broadcast', 'destructive']),
    dryRun: boolDefaultFalse(env.CIGCHAT_DRY_RUN),
    maxBroadcastRecipients: parseInt_(
      env.CIGCHAT_MAX_BROADCAST_RECIPIENTS,
      0,
      'CIGCHAT_MAX_BROADCAST_RECIPIENTS',
    ),
    rps: Math.max(1, parseInt_(env.CIGCHAT_RPS, 5, 'CIGCHAT_RPS')),
    maxRetries: parseInt_(env.CIGCHAT_MAX_RETRIES, 3, 'CIGCHAT_MAX_RETRIES'),
    maxResponseChars: parseInt_(
      env.CIGCHAT_MAX_RESPONSE_CHARS,
      20000,
      'CIGCHAT_MAX_RESPONSE_CHARS',
    ),
  };
}

/** Redacts a token to a short, non-reversible hint. Never returns the raw value. */
export function tokenHint(token: string): string {
  if (!token) return '(none)';
  return token.length <= 8 ? '***' : `***${token.slice(-4)}`;
}

export { boolDefaultTrue };
