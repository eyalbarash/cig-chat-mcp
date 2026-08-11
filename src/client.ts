/**
 * HTTP client for the cig.chat REST API.
 *
 * Rules this file exists to enforce:
 *  - It NEVER throws on an HTTP error; every outcome is a structured `ApiResult`.
 *  - It NEVER logs, echoes or embeds the API token — not in errors, not in dry-run output.
 *  - It NEVER auto-retries a request that may already have sent messages to people.
 */

import type { Config, Tier } from './config.js';

export type ApiResult<T = unknown> = {
  ok: boolean;
  data?: T;
  status?: number;
  /** Present when `ok` is false. Human-readable, token-free. */
  error?: string;
  /** True when the call was short-circuited by dry-run and never hit the network. */
  dry_run?: boolean;
  /** Present on dry-run: exactly what would have been sent. */
  would_call?: { method: string; url: string; body?: unknown };
  /** True when the failure is worth retrying by hand. */
  retryable?: boolean;
  /** Set when the payload was truncated to fit `maxResponseChars`. */
  truncated?: boolean;
};

export type RequestOptions = {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  query?: Record<string, unknown> | undefined;
  body?: unknown;
  /** Risk tier of the calling tool — drives dry-run and retry policy. */
  tier?: Tier;
  /** Marks a POST that only reads, so it is safe to retry and safe under dry-run. */
  readOnly?: boolean;
};

const REDACT_KEYS = [
  'api_key',
  'apikey',
  'secret_key',
  'secret',
  'access_token',
  'refresh_token',
  'password',
  'token',
  'authorization',
];

/** Masks credential-shaped values anywhere in a response payload. */
export function redact(value: unknown, depth = 0): unknown {
  if (depth > 8) return value;
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (REDACT_KEYS.includes(k.toLowerCase()) && typeof v === 'string' && v.length > 0) {
        out[k] = v.length <= 4 ? '***' : `***${v.slice(-4)}`;
      } else {
        out[k] = redact(v, depth + 1);
      }
    }
    return out;
  }
  return value;
}

/** Strips anything token-shaped out of free text before it reaches the model. */
export function scrub(text: string): string {
  return text
    .replace(/Bearer\s+[A-Za-z0-9._~+/-]+=*/gi, 'Bearer ***')
    .replace(/\bsk-[A-Za-z0-9_-]{8,}/g, 'sk-***')
    .replace(/\b[A-Fa-f0-9]{32,}\b/g, '***');
}

/** Pulls a usable message out of the API's inconsistent error shapes. */
function normalizeError(status: number, statusText: string, rawBody: string): string {
  let detail = '';
  const trimmed = rawBody.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed) as Record<string, unknown>;
      const candidate = parsed['message'] ?? parsed['error'] ?? parsed['detail'];
      if (typeof candidate === 'string') detail = candidate;
      else if (candidate !== undefined) detail = JSON.stringify(candidate);
      else detail = trimmed;
    } catch {
      detail = trimmed;
    }
  } else if (/^\s*<(!doctype|html)/i.test(trimmed)) {
    // An HTML body means we hit a proxy/error page, not the API.
    detail = '(HTML error page — check CIGCHAT_BASE_URL and network path)';
  } else {
    detail = trimmed;
  }

  detail = scrub(detail).slice(0, 300);
  let msg = `HTTP ${status} ${statusText}${detail ? ` — ${detail}` : ''}`;

  if (status === 401) {
    msg +=
      '\nHint: the token is invalid or expired. It must be a bot-scoped cig.chat API token ' +
      '(bot → Settings → API). One token controls one bot.';
  } else if (status === 422) {
    msg +=
      '\nHint: 422 usually means an array parameter was sent as an array of strings when the API ' +
      'wants an array of objects — e.g. [{"tag_ns":"f123t456"}], not ["f123t456"].';
  } else if (status === 429) {
    msg += '\nHint: rate limited. Lower CIGCHAT_RPS or add delays between calls.';
  }
  return msg;
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/** Simple token bucket so we throttle ourselves before the API has to. */
class RateLimiter {
  private queue: Promise<void> = Promise.resolve();
  private last = 0;
  constructor(private readonly minIntervalMs: number) {}

  async take(): Promise<void> {
    const run = this.queue.then(async () => {
      const wait = this.last + this.minIntervalMs - Date.now();
      if (wait > 0) await sleep(wait);
      this.last = Date.now();
    });
    this.queue = run.catch(() => undefined);
    return run;
  }
}

export class CigChatClient {
  private readonly limiter: RateLimiter;

  constructor(
    private readonly config: Config,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {
    this.limiter = new RateLimiter(Math.ceil(1000 / Math.max(1, config.rps)));
  }

  get baseUrl(): string {
    return this.config.baseUrl;
  }

  /**
   * A 429 on a send/broadcast POST may mean the job was already queued and then
   * throttled. Retrying could double-send to real people, so we never do.
   */
  private isRetrySafe(opts: RequestOptions): boolean {
    if (opts.method === 'GET' || opts.method === 'PUT' || opts.method === 'DELETE') return true;
    if (opts.readOnly) return true;
    return opts.tier !== 'send' && opts.tier !== 'broadcast';
  }

  private isMutating(opts: RequestOptions): boolean {
    if (opts.readOnly) return false;
    return opts.method !== 'GET';
  }

  private buildUrl(path: string, query?: Record<string, unknown>): string {
    const url = new URL(this.config.baseUrl + (path.startsWith('/') ? path : `/${path}`));
    for (const [k, v] of Object.entries(query ?? {})) {
      if (v === undefined || v === null || v === '') continue;
      if (Array.isArray(v)) {
        for (const item of v) url.searchParams.append(`${k}[]`, String(item));
      } else {
        url.searchParams.set(k, String(v));
      }
    }
    return url.toString();
  }

  async request<T = unknown>(opts: RequestOptions): Promise<ApiResult<T>> {
    const url = this.buildUrl(opts.path, opts.query);

    if (this.config.dryRun && this.isMutating(opts)) {
      return {
        ok: true,
        dry_run: true,
        would_call: {
          method: opts.method,
          url,
          ...(opts.body !== undefined ? { body: redact(opts.body) } : {}),
        },
      };
    }

    const maxAttempts = this.isRetrySafe(opts) ? this.config.maxRetries + 1 : 1;
    let lastError = 'request failed';
    let lastStatus: number | undefined;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await this.limiter.take();

      let res: Response;
      try {
        res = await this.fetchImpl(url, {
          method: opts.method,
          headers: {
            // The API requires JSON content negotiation even on GET.
            Authorization: `Bearer ${this.config.apiToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'User-Agent': '@cig-chat/mcp',
          },
          ...(opts.body !== undefined ? { body: JSON.stringify(opts.body) } : {}),
        });
      } catch (err) {
        lastError = scrub(err instanceof Error ? err.message : 'network error');
        if (attempt < maxAttempts - 1) {
          await sleep(this.backoffMs(attempt));
          continue;
        }
        return { ok: false, error: lastError, retryable: true };
      }

      if (res.ok) {
        const text = await res.text().catch(() => '');
        if (!text) return { ok: true, status: res.status, data: undefined as T };
        let parsed: unknown;
        try {
          parsed = JSON.parse(text);
        } catch {
          return { ok: true, status: res.status, data: text as unknown as T };
        }
        return this.finish<T>(redact(parsed) as T, res.status);
      }

      const rawBody = await res.text().catch(() => '');
      lastStatus = res.status;
      lastError = normalizeError(res.status, res.statusText, rawBody);

      const worthRetry = res.status === 429 || res.status >= 500;
      if (worthRetry && attempt < maxAttempts - 1) {
        const retryAfter = Number(res.headers.get('retry-after'));
        await sleep(
          Number.isFinite(retryAfter) && retryAfter > 0
            ? Math.min(retryAfter * 1000, 30_000)
            : this.backoffMs(attempt),
        );
        continue;
      }

      if (worthRetry && maxAttempts === 1) {
        return {
          ok: false,
          status: res.status,
          retryable: true,
          error:
            `${lastError}\nNot auto-retried: this call can send messages to people, and a retry ` +
            `could deliver them twice. Verify whether it went through before re-running.`,
        };
      }

      return {
        ok: false,
        status: res.status,
        error: lastError,
        ...(worthRetry ? { retryable: true } : {}),
      };
    }

    return {
      ok: false,
      error: lastError,
      retryable: true,
      ...(lastStatus !== undefined ? { status: lastStatus } : {}),
    };
  }

  /** Exponential backoff with full jitter. */
  private backoffMs(attempt: number): number {
    const capped = Math.min(500 * 2 ** attempt, 8000);
    return Math.floor(Math.random() * capped);
  }

  private finish<T>(data: T, status: number): ApiResult<T> {
    const serialized = JSON.stringify(data);
    if (serialized && serialized.length > this.config.maxResponseChars) {
      return {
        ok: true,
        status,
        truncated: true,
        data: (serialized.slice(0, this.config.maxResponseChars) + '…') as unknown as T,
      };
    }
    return { ok: true, status, data };
  }

  /** Cheap credential probe used by `cigchat_whoami` and by `--check`. */
  async verifyCredentials(): Promise<ApiResult> {
    return this.request({ method: 'GET', path: '/flow/tags', query: { limit: 1, page: 1 } });
  }

  /**
   * Counts subscribers matching a filter, for broadcast impact estimates.
   * Stops at `maxPages` and reports the count as a lower bound.
   */
  async estimateAudience(
    filter: Record<string, unknown>,
    maxPages = 50,
  ): Promise<{ count: number; exact: boolean }> {
    let count = 0;
    for (let page = 1; page <= maxPages; page++) {
      const res = await this.request<{ data?: unknown[] }>({
        method: 'GET',
        path: '/subscribers',
        query: { ...filter, limit: 100, page },
      });
      if (!res.ok) break;
      const rows = Array.isArray(res.data?.data) ? res.data.data : [];
      count += rows.length;
      if (rows.length < 100) return { count, exact: true };
    }
    return { count, exact: false };
  }
}
