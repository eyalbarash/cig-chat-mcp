/** Public API, for embedding this server in another process. */

export { buildServer, SERVER_NAME, SERVER_VERSION } from './server.js';
export type { BuiltServer } from './server.js';

export { loadConfig, tokenHint, TIERS, DEFAULT_BASE_URL } from './config.js';
export type { Config, Tier, LoadConfigOptions } from './config.js';

export { CigChatClient, redact, scrub } from './client.js';
export type { ApiResult, RequestOptions } from './client.js';

export { ToolRegistry, allTools } from './registry.js';
export type { ToolsetInfo } from './registry.js';

export {
  defineTool,
  toolFromOperation,
  buildSchema,
  toToolResult,
  partitionArgs,
  renderPath,
} from './tools.js';
export type { CigChatTool, ToolContext, ToolResult } from './tools.js';

export { NsResolver, looksLikeNs, LOOKUPS } from './resolve.js';
export { SafetyGate } from './safety.js';

export type { OperationSpec, ParamSpec } from './types.js';
export { OPERATIONS } from './generated/operations.js';
export { TOOLSET_META } from './generated/toolsets.js';
