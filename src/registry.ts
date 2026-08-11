/**
 * Decides which tools this process exposes.
 *
 * Two independent filters: the toolset (which domain) and the risk tier (how dangerous).
 * Tools that do not pass are never listed, so they cost no context in the client.
 */

import type { Config } from './config.js';
import type { CigChatTool } from './tools.js';
import { toolFromOperation } from './tools.js';
import { OPERATIONS } from './generated/operations.js';
import { TOOLSET_META } from './generated/toolsets.js';
import { coreTools } from './handwritten/core.js';
import { apiCallTool } from './handwritten/api-call.js';
import { whatsappTools } from './handwritten/whatsapp.js';

export type ToolsetInfo = {
  id: string;
  label: string;
  labelHe: string;
  description: string;
  toolCount: number;
  enabled: boolean;
};

/** Every tool this build knows about, generated and hand-written alike. */
export function allTools(): CigChatTool[] {
  return [...coreTools, ...whatsappTools, ...OPERATIONS.map(toolFromOperation), apiCallTool];
}

export class ToolRegistry {
  private readonly everything: CigChatTool[];
  /** Toolsets switched on at runtime via `cigchat_enable_toolset`. */
  private readonly dynamicallyEnabled = new Set<string>();

  constructor(private readonly config: Config) {
    this.everything = allTools();
  }

  private toolsetEnabled(id: string): boolean {
    // `core` is the discovery surface; without it a narrowed server is a dead end.
    if (id === 'core') return true;
    if (this.dynamicallyEnabled.has(id)) return true;
    const { toolsets } = this.config;
    if (toolsets === 'all') return true;
    if (toolsets === 'dynamic') return false;
    return toolsets.includes(id);
  }

  /** The tools that should be registered right now. */
  active(): CigChatTool[] {
    return this.everything.filter(
      (t) => this.toolsetEnabled(t.toolset) && this.config.allow.includes(t.tier),
    );
  }

  find(name: string): CigChatTool | undefined {
    return this.active().find((t) => t.name === name);
  }

  /** Turns a toolset on for the rest of the process. Returns false if unknown. */
  enable(id: string): boolean {
    if (!TOOLSET_META.some((m) => m.id === id)) return false;
    this.dynamicallyEnabled.add(id);
    return true;
  }

  describeToolsets(): ToolsetInfo[] {
    return TOOLSET_META.map((meta) => ({
      ...meta,
      toolCount: this.everything.filter((t) => t.toolset === meta.id).length,
      enabled: this.toolsetEnabled(meta.id),
    })).filter((t) => t.toolCount > 0);
  }
}
