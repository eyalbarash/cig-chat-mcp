# @cig-chat/mcp

MCP server for the [cig.chat](https://www.cig.chat) API. Connect Claude, Cursor, or any
MCP client to your cig.chat bot and drive subscribers, tags, flows, WhatsApp templates,
broadcasts and the shop in plain language.

**243 API operations · 250 tools · 13 toolsets.**

> This package is a client for **your own** cig.chat account. It ships with no credentials
> and no default account. You supply your own bot token at setup, it stays on your machine,
> and it is never logged, echoed or transmitted anywhere except to `app.cig.chat`.

---

## 1. Get your API token

1. Sign in to [cig.chat](https://app.cig.chat).
2. Open the bot you want to control.
3. Go to **Settings → API** and copy the token.

**One token controls exactly one bot.** There is no workspace-wide token and no bot selector —
to work with a second bot, add a second server entry with that bot's token.

Treat the token like a password: it can read your subscriber list and send messages on your
behalf. Never commit it, never paste it into a chat, and rotate it in cig.chat if it leaks.

## 2. Add the server

### Claude Code

```bash
claude mcp add cigchat --env CIGCHAT_API_TOKEN=your-token-here -- npx -y @cig-chat/mcp
```

### Claude Desktop

Edit `claude_desktop_config.json` (macOS:
`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "cigchat": {
      "command": "npx",
      "args": ["-y", "@cig-chat/mcp"],
      "env": { "CIGCHAT_API_TOKEN": "your-token-here" }
    }
  }
}
```

### Cursor

Same shape, in `~/.cursor/mcp.json`.

## 3. Check it works

```bash
CIGCHAT_API_TOKEN=your-token-here npx -y @cig-chat/mcp --check
```

Then ask your assistant: _"Which cig.chat bot am I connected to?"_ — it will call
`cigchat_whoami`.

---

## Safety

This server can spend money and cannot undo what it does. Read this section before you
enable it for a production bot.

**Every tool is available by default.** That includes broadcasting to your entire subscriber
list. The protections are:

| Protection         | What it does                                                                                                                       |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Named by risk      | Every fan-out tool is `cigchat_broadcast_*`, every 1:1 send `cigchat_send_*`. One deny rule covers the class.                      |
| Confirmation step  | `broadcast` and `destructive` tools refuse the first call and return an impact statement, an audience count, and a one-time token. |
| Argument binding   | The token is bound to a hash of the exact arguments — approval for a 12-person test cannot be replayed on a 50,000-person blast.   |
| No blind retry     | A rate-limited send or broadcast is never retried automatically, because the messages may already have gone out.                   |
| Credential masking | API keys in responses are truncated to `***last4`; your token never appears in output.                                             |

**Your MCP client's approval prompt is the real gate.** This server can present the facts;
only you can approve. Do not enable auto-approval for `cigchat_broadcast_*`.

### Recommended settings for a production bot

```json
"env": {
  "CIGCHAT_API_TOKEN": "your-token-here",
  "CIGCHAT_MAX_BROADCAST_RECIPIENTS": "500",
  "CIGCHAT_ALLOW": "read,write,send"
}
```

That keeps everyday work available, caps any broadcast, and leaves fan-out off entirely.

### Trying it safely

```json
"env": { "CIGCHAT_API_TOKEN": "your-token-here", "CIGCHAT_DRY_RUN": "true" }
```

Every write becomes a no-op that reports exactly what it _would_ have sent. Reads still work.

---

## Configuration

| Variable                           | Default                    | Purpose                                                              |
| ---------------------------------- | -------------------------- | -------------------------------------------------------------------- |
| `CIGCHAT_API_TOKEN`                | —                          | **Required.** Your bot-scoped token.                                 |
| `CIGCHAT_TOOLSETS`                 | `all`                      | `all`, `dynamic`, or a comma-separated list of toolset ids.          |
| `CIGCHAT_ALLOW`                    | all tiers                  | Which risk tiers to expose: `read,write,send,broadcast,destructive`. |
| `CIGCHAT_CONFIRM_TIERS`            | `broadcast,destructive`    | Which tiers require a confirmation token.                            |
| `CIGCHAT_DRY_RUN`                  | `false`                    | `true` makes every write a no-op that echoes the request.            |
| `CIGCHAT_MAX_BROADCAST_RECIPIENTS` | `0` (no cap)               | Refuse broadcasts above this audience size.                          |
| `CIGCHAT_RPS`                      | `5`                        | Client-side request rate limit.                                      |
| `CIGCHAT_MAX_RETRIES`              | `3`                        | Retry attempts for rate limits and server errors.                    |
| `CIGCHAT_MAX_RESPONSE_CHARS`       | `20000`                    | Truncate long responses instead of flooding context.                 |
| `CIGCHAT_BASE_URL`                 | `https://app.cig.chat/api` | Override the API base URL.                                           |

### Toolsets

250 tools is a lot of context on clients that send every schema up front. Narrow with
`CIGCHAT_TOOLSETS`, or set it to `dynamic` to start with just the core tools and let the
assistant switch on what it needs.

| Id              | Tools | Covers                                                                |
| --------------- | ----: | --------------------------------------------------------------------- |
| `core`          |     4 | Identity, lookup, toolset discovery. Always on.                       |
| `subscribers`   |    40 | Find, create, update subscribers; tags, labels, fields, opt-in.       |
| `flow`          |    43 | Sub-flows, tags, user/bot fields, shortcuts, closing notes, segments. |
| `conversations` |     2 | Conversation history and agent activity.                              |
| `whatsapp`      |     8 | WhatsApp and Facebook utility templates.                              |
| `messaging`     |    21 | Sends and broadcasts.                                                 |
| `shop`          |    49 | Products, variants, orders, discounts, locations, carts.              |
| `team`          |    17 | Ticket lists, labels, agent groups.                                   |
| `ai`            |    13 | AI agents and tasks, OpenAI embeddings.                               |
| `integrations`  |    30 | Third-party integration credentials, mini-apps.                       |
| `workspace`     |    17 | Workspace settings, members, analytics.                               |
| `templates`     |     3 | Flow templates and install links.                                     |
| `escape`        |     1 | `cigchat_api_call` for anything not wrapped.                          |

Full list: [`docs/TOOLS.md`](./docs/TOOLS.md).

---

## Names instead of ids

cig.chat identifies most things by opaque ids like `f123t456`. You do not have to know them —
every tool accepts the entity's **name** and resolves it:

> _"Tag Dana as VIP customers"_ → resolves `VIP customers` → `f123t456` → tags her.

If a name is ambiguous the server refuses and lists the candidates rather than guessing. Use
`cigchat_resolve` to browse what exists.

## WhatsApp templates

Template variables are defined when the template is approved, so ask first:

```
cigchat_describe_whatsapp_template({ name: "order_ready" })
→ expected_variables: ["HEADER_IMAGE", "BODY_1", "BODY_2"]
```

Then send with those exact keys. Getting this wrong on a broadcast is an expensive way to
discover a typo.

---

## Troubleshooting

| Symptom                                   | Cause                                                                                                     |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `401` / credentials failed                | Token is wrong, revoked, or from a different bot. Regenerate in Settings → API.                           |
| A tool is missing                         | Its toolset or tier is disabled. Run `cigchat_list_toolsets`.                                             |
| `429` rate limited                        | Lower `CIGCHAT_RPS`. Sends are never auto-retried — check whether the message went out before re-running. |
| `422 field is required`                   | An array parameter needs objects, not strings: `[{"tag_ns":"f1t1"}]`.                                     |
| Broadcast returns `requires_confirmation` | Working as designed. Show the impact statement to a human, then re-call with the token.                   |

## Development

```bash
npm install
npm run spec:pull   # refresh spec/openapi.json from the live API
npm run gen         # regenerate tools from the spec + spec/overrides.ts
npm test
npm run build
```

Tools are generated from the vendored OpenAPI document; `spec/overrides.ts` is the only
hand-maintained mapping. Generated output is committed, so an upstream API change shows up
as a reviewable diff.

## Links

- [cig.chat developer tools](https://www.cig.chat/developers)
- [REST API reference](https://app.cig.chat/api)
- [Report an issue](https://github.com/eyalbarash/cig-chat-mcp/issues)

## License

MIT © Dialogue Online Services LTD
