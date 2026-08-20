/**
 * The MCP adapter. Everything above this file is transport-agnostic and testable without
 * a transport; this is the thin layer that binds tools onto an McpServer.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Config } from './config.js';
import { loadConfig } from './config.js';
import { CigChatClient } from './client.js';
import { SafetyGate } from './safety.js';
import { NsResolver } from './resolve.js';
import { ToolRegistry } from './registry.js';
import { LOOKUPS } from './resolve.js';
import type { ToolContext } from './tools.js';

export const SERVER_NAME = 'cigchat';
export const SERVER_VERSION = '0.1.1';

export type BuiltServer = {
  server: McpServer;
  registry: ToolRegistry;
  config: Config;
};

export function buildServer(configOverride?: Partial<Config>): BuiltServer {
  const config = { ...loadConfig(), ...configOverride } as Config;

  const client = new CigChatClient(config);
  const registry = new ToolRegistry(config);
  const resolver = new NsResolver(client);
  const safety = new SafetyGate(config, client);

  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    {
      instructions:
        'Tools for the cig.chat conversational-marketing platform (WhatsApp, SMS, email, ' +
        'web chat).\n\n' +
        'Key facts:\n' +
        '- The configured token controls exactly ONE bot. There is no bot selector.\n' +
        '- Entities are identified by opaque namespace ids like "f123t456", but every tool ' +
        'also accepts the entity NAME and resolves it. Use cigchat_resolve to list options.\n' +
        '- Tools named cigchat_broadcast_* send to many real people, cost money, and cannot be ' +
        'undone. They return an audience estimate and a confirmation token on the first call; ' +
        'show that to the human and only proceed once they explicitly approve.\n' +
        '- Call cigchat_describe_whatsapp_template before sending any WhatsApp template.\n' +
        '- List endpoints paginate with limit (max 100) and page (1-based).',
    },
  );

  const registered = new Set<string>();

  const notifyToolsChanged = async (): Promise<void> => {
    syncTools();
    try {
      await server.server.sendToolListChanged();
    } catch {
      // Client may not support the notification; the tools are registered regardless.
    }
  };

  const ctx: ToolContext = {
    client,
    safety,
    resolver,
    registry,
    onToolsChanged: notifyToolsChanged,
  };

  function syncTools(): void {
    for (const tool of registry.active()) {
      if (registered.has(tool.name)) continue;
      registered.add(tool.name);
      server.tool(tool.name, tool.description, tool.schema.shape, async (args: unknown) => {
        let result;
        try {
          result = await tool.invoke(ctx, args);
        } catch (err) {
          result = {
            ok: false,
            error: err instanceof Error ? err.message : 'tool failed',
          };
        }
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
          isError: !result.ok,
        };
      });
    }
  }

  syncTools();
  registerResources(server, resolver);

  return { server, registry, config };
}

/**
 * Small enumerable lookups exposed as resources, so an agent can pull a whole name→id map
 * in one read instead of a chain of resolve calls.
 */
function registerResources(server: McpServer, resolver: NsResolver): void {
  for (const kind of Object.keys(LOOKUPS)) {
    server.resource(
      `cigchat-${kind}s`,
      `cigchat://${kind}s`,
      {
        description: `All ${kind}s in this bot as {name, ns} pairs.`,
        mimeType: 'application/json',
      },
      async (uri) => {
        const rows = await resolver.list(kind).catch(() => []);
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: 'application/json',
              text: JSON.stringify(rows, null, 2),
            },
          ],
        };
      },
    );
  }
}
