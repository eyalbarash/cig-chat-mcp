/**
 * Template discovery.
 *
 * WhatsApp and Facebook utility templates take variables whose keys are defined when the
 * template is approved — an agent cannot guess them. This exposes them, so a send can be
 * assembled correctly the first time instead of failing at the API.
 */

import { z } from 'zod';
import { defineTool, type CigChatTool, type ToolResult } from '../tools.js';

type TemplateRow = {
  name?: string;
  namespace?: string;
  language?: string;
  lang?: string;
  params?: unknown;
};

function extractVariables(row: TemplateRow): string[] {
  const raw = row.params;
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === 'string' && raw.trim() !== '') {
    return raw
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (raw && typeof raw === 'object') return Object.keys(raw as Record<string, unknown>);
  return [];
}

function describeTool(opts: {
  name: string;
  label: string;
  path: string;
  sendTools: string;
}): CigChatTool {
  return defineTool({
    name: opts.name,
    description:
      `Look up a ${opts.label} by name and return the variable keys it expects, its namespace ` +
      `and its language. Call this BEFORE ${opts.sendTools} so you send the right variables — ` +
      `a template sent with wrong or missing keys is rejected, and for broadcasts that is an ` +
      `expensive way to find out. [POST ${opts.path}]`,
    toolset: 'whatsapp',
    tier: 'read',
    schema: z.object({
      name: z.string().describe('Exact template name as approved in cig.chat.'),
    }),
    run: async (ctx, args): Promise<ToolResult> => {
      const res = await ctx.client.request<{ data?: TemplateRow[] }>({
        method: 'POST',
        path: opts.path,
        query: { name: args.name, limit: 5, page: 1 },
        readOnly: true,
      });
      if (!res.ok) return { ok: false, error: res.error ?? 'lookup failed' };

      const rows = Array.isArray(res.data?.data) ? res.data.data : [];
      const match =
        rows.find((r) => (r.name ?? '').toLowerCase() === args.name.toLowerCase()) ?? rows[0];
      if (!match) {
        return {
          ok: false,
          error:
            `No ${opts.label} named "${args.name}" was found. ` +
            (rows.length
              ? `Available: ${rows
                  .map((r) => r.name)
                  .filter(Boolean)
                  .join(', ')}`
              : 'The bot has no templates matching that name.'),
        };
      }

      const variables = extractVariables(match);
      return {
        ok: true,
        data: {
          name: match.name ?? args.name,
          namespace: match.namespace ?? null,
          language: match.language ?? match.lang ?? null,
          expected_variables: variables,
          example_params: Object.fromEntries(variables.map((v) => [v, `<${v.toLowerCase()}>`])),
          usage_hint:
            variables.length > 0
              ? `Pass these keys in the template params when calling ${opts.sendTools}.`
              : 'This template takes no variables.',
        },
      };
    },
  });
}

export const whatsappTools: CigChatTool[] = [
  describeTool({
    name: 'cigchat_describe_whatsapp_template',
    label: 'WhatsApp template',
    path: '/whatsapp-template/list',
    sendTools: 'cigchat_send_whatsapp_template or cigchat_broadcast_whatsapp_template_by_tag',
  }),
  describeTool({
    name: 'cigchat_describe_fb_utility_template',
    label: 'Facebook utility message template',
    path: '/facebook-utility-message-template/list',
    sendTools: 'cigchat_send_fb_utility_template or cigchat_broadcast_fb_utility_template_by_tag',
  }),
];
