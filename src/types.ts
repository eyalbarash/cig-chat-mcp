/**
 * Shared type vocabulary.
 *
 * Kept dependency-free so both the generated operation table and the codegen script can
 * import it without pulling in zod or the MCP SDK.
 */

export const TIERS = ['read', 'write', 'destructive', 'send', 'broadcast'] as const;
export type Tier = (typeof TIERS)[number];

export const TIER_NOTES: Record<Tier, string> = {
  read: 'Reads data. No state change.',
  write: 'Changes data in a way you can change back.',
  destructive: 'Irreversible data loss. Requires confirmation by default.',
  send: 'Delivers a message to one person.',
  broadcast: 'Delivers to many people at once. Requires confirmation by default.',
};

/** A parameter, as emitted by codegen. Plain data so the generated file stays diffable. */
export type ParamSpec = {
  name: string;
  in: 'path' | 'query' | 'body';
  type: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object' | 'any';
  required?: boolean;
  description?: string;
  enum?: string[];
  items?: ParamSpec;
  properties?: ParamSpec[];
  example?: string;
  /** Marks a value that may be given as a human name instead of an opaque `*_ns`. */
  nsKind?: string;
};

/** An API operation, as emitted by codegen. */
export type OperationSpec = {
  name: string;
  description: string;
  toolset: string;
  tier: Tier;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  params: ParamSpec[];
  /** A POST that only reads — safe to retry, unaffected by dry-run. */
  readOnly?: boolean;
  /** Request field used to size a broadcast audience before sending. */
  audienceFrom?: string;
  /** Upstream operationId, for traceability back to the spec. */
  operationId: string;
};
