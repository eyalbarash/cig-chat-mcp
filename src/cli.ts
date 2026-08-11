/**
 * Command-line entry point. Published as the `cigchat-mcp` bin, so `npx @cig-chat/mcp` runs it.
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { buildServer, SERVER_VERSION } from './server.js';
import { loadConfig, tokenHint } from './config.js';
import { CigChatClient } from './client.js';
import { ToolRegistry } from './registry.js';

const HELP = `cigchat-mcp ${SERVER_VERSION} — MCP server for the cig.chat API

Usage:
  cigchat-mcp                 Start the server on stdio (what MCP clients run).
  cigchat-mcp --check         Verify CIGCHAT_API_TOKEN against the API and exit.
  cigchat-mcp --list-tools    Print the tools this configuration exposes and exit.
  cigchat-mcp --version       Print the version and exit.

Required:
  CIGCHAT_API_TOKEN           YOUR cig.chat bot token (bot → Settings → API).
                              One token controls exactly one bot. Never share it.

Optional:
  CIGCHAT_TOOLSETS            "all" (default), "dynamic", or a comma-separated list.
  CIGCHAT_ALLOW               Risk tiers to expose: read,write,send,broadcast,destructive.
                              Default: all of them.
  CIGCHAT_CONFIRM_TIERS       Tiers needing a confirmation token. Default: broadcast,destructive.
  CIGCHAT_DRY_RUN             "true" to make every write a no-op that echoes what it would send.
  CIGCHAT_MAX_BROADCAST_RECIPIENTS  Refuse broadcasts above this audience size. 0 = no cap.
  CIGCHAT_RPS                 Client-side request rate limit. Default 5.
  CIGCHAT_BASE_URL            Override the API base URL.

Docs: https://www.cig.chat/mcp
`;

async function listTools(): Promise<void> {
  const config = loadConfig({ requireToken: false });
  const registry = new ToolRegistry(config);
  const tools = registry.active();
  const byTier = new Map<string, number>();
  for (const t of tools) byTier.set(t.tier, (byTier.get(t.tier) ?? 0) + 1);

  process.stdout.write(`${tools.length} tools active\n`);
  for (const [tier, n] of [...byTier].sort()) process.stdout.write(`  ${tier}: ${n}\n`);
  process.stdout.write('\n');
  for (const t of tools) {
    process.stdout.write(`${t.tier.padEnd(12)} ${t.toolset.padEnd(14)} ${t.name}\n`);
  }
}

async function check(): Promise<number> {
  const config = loadConfig();
  process.stdout.write(`Base URL: ${config.baseUrl}\nToken:    ${tokenHint(config.apiToken)}\n`);
  const client = new CigChatClient(config);
  const res = await client.verifyCredentials();
  if (res.ok) {
    process.stdout.write('Credentials OK.\n');
    return 0;
  }
  process.stdout.write(`Credentials FAILED.\n${res.error}\n`);
  return 1;
}

export async function main(argv: string[] = process.argv.slice(2)): Promise<void> {
  if (argv.includes('--help') || argv.includes('-h')) {
    process.stdout.write(HELP);
    return;
  }
  if (argv.includes('--version') || argv.includes('-v')) {
    process.stdout.write(`${SERVER_VERSION}\n`);
    return;
  }
  if (argv.includes('--list-tools')) {
    await listTools();
    return;
  }
  if (argv.includes('--check')) {
    process.exitCode = await check();
    return;
  }

  const { server } = buildServer();
  await server.connect(new StdioServerTransport());
}

// Only auto-run when executed directly, so tests can import `main`.
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err: unknown) => {
    process.stderr.write(`[cigchat-mcp] ${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(1);
  });
}
