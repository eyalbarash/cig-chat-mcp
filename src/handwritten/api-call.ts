/**
 * Escape hatch for endpoints this build does not wrap — new API surface, or something the
 * generator skipped. Auth, rate limiting, retries and redaction all still apply.
 */

import { z } from 'zod';
import { defineTool, toToolResult } from '../tools.js';

export const apiCallTool = defineTool({
  name: 'cigchat_api_call',
  description:
    'Call any cig.chat API endpoint directly, for endpoints without a dedicated tool. ' +
    'Prefer the dedicated tool when one exists — it has a validated schema and safety checks ' +
    'that this does not. The Authorization header is added for you; never put a token in the ' +
    'arguments. Base URL is https://app.cig.chat/api. Full API reference: ' +
    'https://app.cig.chat/api',
  toolset: 'escape',
  tier: 'write',
  schema: z.object({
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).describe('HTTP method.'),
    path: z
      .string()
      .describe('Path relative to the API base, e.g. "/flow/tags". Must start with "/".'),
    query: z.record(z.unknown()).optional().describe('Query-string parameters.'),
    body: z.record(z.unknown()).optional().describe('JSON request body.'),
  }),
  run: async (ctx, args) => {
    if (!args.path.startsWith('/')) {
      return { ok: false, error: 'path must start with "/" — it is relative to the API base.' };
    }
    const result = await ctx.client.request({
      method: args.method,
      path: args.path,
      ...(args.query ? { query: args.query } : {}),
      ...(args.body ? { body: args.body } : {}),
      // Unwrapped endpoints get the cautious treatment: assume a write unless it is a GET.
      tier: args.method === 'GET' ? 'read' : 'write',
      ...(args.method === 'GET' ? { readOnly: true } : {}),
    });
    return toToolResult(result);
  },
});
