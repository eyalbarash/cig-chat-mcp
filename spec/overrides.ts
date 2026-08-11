/**
 * The only hand-maintained mapping in this repo.
 *
 * Everything else about a tool — name, parameters, types, descriptions — is derived from
 * spec/openapi.json. This file encodes the judgment the spec cannot: which domain a tool
 * belongs to, how dangerous it is, and which parameters accept a human name.
 *
 * When the upstream spec adds operations, `pnpm gen` picks them up automatically; only
 * genuinely new *kinds* of operation need an entry here.
 */

import type { Tier } from '../src/types.js';

/** Toolset ids, in the order they appear in docs. */
export const TOOLSETS: { id: string; label: string; labelHe: string; description: string }[] = [
  { id: 'core', label: 'Core', labelHe: 'ליבה', description: 'Identity, lookup and discovery.' },
  {
    id: 'subscribers',
    label: 'Subscribers',
    labelHe: 'מנויים',
    description: 'Find, create and update subscribers; tags, labels, fields, opt-in state.',
  },
  {
    id: 'flow',
    label: 'Flow',
    labelHe: 'תזרים',
    description: 'Sub-flows, tags, user fields, bot fields, shortcuts, closing notes, segments.',
  },
  {
    id: 'conversations',
    label: 'Conversations',
    labelHe: 'שיחות',
    description: 'Conversation history and agent activity.',
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp & Meta templates',
    labelHe: 'תבניות ואטסאפ ומטא',
    description: 'WhatsApp and Facebook utility message templates.',
  },
  {
    id: 'messaging',
    label: 'Messaging',
    labelHe: 'שליחה',
    description: 'Send to one subscriber, or broadcast to many. Handle with care.',
  },
  {
    id: 'shop',
    label: 'Shop',
    labelHe: 'חנות',
    description: 'Products, variants, types, vendors, tags, orders, discounts, locations, carts.',
  },
  {
    id: 'team',
    label: 'Team',
    labelHe: 'צוות',
    description: 'Ticket lists, team labels and agent groups.',
  },
  {
    id: 'ai',
    label: 'AI',
    labelHe: 'בינה מלאכותית',
    description: 'AI agents and tasks, provider settings, OpenAI embeddings.',
  },
  {
    id: 'integrations',
    label: 'Integrations',
    labelHe: 'אינטגרציות',
    description: 'Third-party integration credentials and mini-apps.',
  },
  {
    id: 'workspace',
    label: 'Workspace',
    labelHe: 'סביבת עבודה',
    description: 'Workspace settings, members, analytics and account info.',
  },
  {
    id: 'templates',
    label: 'Templates',
    labelHe: 'תבניות',
    description: 'Flow templates and one-time install links.',
  },
  {
    id: 'escape',
    label: 'Escape hatch',
    labelHe: 'קריאה חופשית',
    description: 'Call any cig.chat endpoint directly.',
  },
];

/** OpenAPI tag → toolset id. */
export const TAG_TO_TOOLSET: Record<string, string> = {
  'Agent Group': 'team',
  Ecommerce: 'shop',
  'Facebook Utility Message Template': 'whatsapp',
  Flow: 'flow',
  'Flow AI Hub': 'ai',
  'Flow Bot Field': 'flow',
  'Flow Closing Notes': 'flow',
  'Flow Conversation': 'conversations',
  'Flow Custom Events': 'flow',
  'Flow Segment': 'flow',
  'Flow Shortcuts': 'flow',
  'Flow Tag': 'flow',
  'Flow User Field': 'flow',
  Integration: 'integrations',
  'Mini-App': 'integrations',
  OpenAI: 'ai',
  Sending: 'messaging',
  Subscriber: 'subscribers',
  'Team Label': 'team',
  Template: 'templates',
  'Ticket List': 'team',
  User: 'workspace',
  'Whatsapp Template': 'whatsapp',
  Workspace: 'workspace',
};

/**
 * POSTs that only read. Without this list they would be classified as writes, blocked by
 * dry-run, and excluded from retry — all wrong.
 */
export const READ_ONLY_OPERATIONS = new Set([
  'listWhatsappTemplates',
  'listFacebookUtilityMessageTemplates',
  'flowBotUserChatMessagesByMids',
  'flowViewAiAgentInfo',
  'flowViewAiTaskInfo',
]);

/** Explicit tier assignments that override the method-derived default. */
export const TIER_OVERRIDES: Record<string, Tier> = {
  // Anything that puts a message in front of a person.
  flowBotUserSendMainFlow: 'send',
  flowBotUserSendSubFlow: 'send',
  flowBotUserSendSubFlowByFlowName: 'send',
  flowBotUserSendSubFlowByUserId: 'send',
  flowBotUserSendText: 'send',
  flowBotUserSendSms: 'send',
  flowBotUserSendEmail: 'send',
  flowBotUserSendNode: 'send',
  flowBotUserSendContent: 'send',
  flowBotUserSendWhatsappTemplate: 'send',
  flowBotUserSendWhatsappTemplateByUserId: 'send',
  flowBotUserSendFacebookUtilityMessageTemplate: 'send',
  flowBotUserSendFacebookUtilityMessageTemplateByUserId: 'send',
  // These can trigger a flow, which can message the subscriber.
  flowBotUserAppTrigger: 'send',
  flowBotUserLogCustomEvent: 'send',
  flowBotUserCartPaid: 'send',
  flowBotUserUpdateOrderStatus: 'send',

  // Fan-out: one call, many recipients, no undo.
  flowBotUserBroadcast: 'broadcast',
  flowBotUserBroadcastByTag: 'broadcast',
  flowBotUserBroadcastBySegment: 'broadcast',
  flowBotUserBroadcastByUserId: 'broadcast',
  flowBotUserBroadcastWhatsappTemplateByTag: 'broadcast',
  flowBotUserBroadcastWhatsappTemplateByUserId: 'broadcast',
  flowBotUserBroadcastFacebookUtilityMessageTemplateByTag: 'broadcast',
  flowBotUserBroadcastFacebookUtilityMessageTemplateByUserId: 'broadcast',

  // DELETEs that are ordinary reversible edits, not data loss.
  flowBotUserRemoveTag: 'write',
  flowBotUserRemoveTagByName: 'write',
  flowBotUserRemoveTags: 'write',
  flowBotUserRemoveTagsByName: 'write',
  flowBotUserRemoveLabelsByName: 'write',
  flowBotUserClearUserField: 'write',
  flowBotUserClearUserFieldByName: 'write',
  flowBotUserClearUserFields: 'write',
  flowBotUserClearUserFieldsByName: 'write',
  flowBotUserOptOutSms: 'write',
  flowBotUserOptOutEmail: 'write',
  flowBotUserUnsubscribeFromBot: 'write',
  flowBotUserRemoveFromCart: 'write',
  flowBotUserEmptyCart: 'write',
};

/**
 * Which request field identifies the audience, so a broadcast can be sized before it fires.
 * Explicit recipient lists (`user_ns_list`, `user_id_list`) are counted directly.
 */
export const AUDIENCE_FROM: Record<string, string> = {
  flowBotUserBroadcastByTag: 'tags',
  flowBotUserBroadcastWhatsappTemplateByTag: 'tags',
  flowBotUserBroadcastFacebookUtilityMessageTemplateByTag: 'tags',
  flowBotUserBroadcastBySegment: 'segment_ns',
};

/**
 * Parameters that accept a human name as well as an opaque namespace id.
 * `var_ns` is ambiguous — resolved per-path in the generator.
 */
export const NS_PARAMS: Record<string, string> = {
  tag_ns: 'tag',
  tags: 'tag',
  exclude_tags: 'tag',
  sub_flow_ns: 'flow',
  flow_ns: 'flow',
  segment_ns: 'segment',
  event_ns: 'custom_event',
  ai_agent_ns: 'ai_agent',
  ai_task_ns: 'ai_task',
  agent_id: 'agent',
  agent_group_id: 'agent_group',
};

/** Operations that get no tool under any configuration. */
export const DENYLIST = new Set<string>([]);

/**
 * Hand-written tool-name overrides.
 *
 * Two reasons an entry appears here: the path-derived name collides with another, or the tool
 * is dangerous enough that its name should start with the verb — so a user can write one deny
 * rule (`cigchat_broadcast_*`) and cover the whole class.
 */
export const NAME_OVERRIDES: Record<string, string> = {
  // Collisions: a list endpoint and its {id} sibling slug identically.
  flowClosingNotes: 'cigchat_list_closing_notes',
  flowClosingNote: 'cigchat_get_closing_note',
  flowShortcuts: 'cigchat_list_shortcuts',
  flowShortcut: 'cigchat_get_shortcut',

  // Every tool that puts a message in front of a person starts with `send_`.
  flowBotUserSendMainFlow: 'cigchat_send_main_flow',
  flowBotUserSendSubFlow: 'cigchat_send_subflow',
  flowBotUserSendSubFlowByFlowName: 'cigchat_send_subflow_by_name',
  flowBotUserSendSubFlowByUserId: 'cigchat_send_subflow_by_user_id',
  flowBotUserSendText: 'cigchat_send_text',
  flowBotUserSendSms: 'cigchat_send_sms',
  flowBotUserSendEmail: 'cigchat_send_email',
  flowBotUserSendNode: 'cigchat_send_node',
  flowBotUserSendContent: 'cigchat_send_content',
  flowBotUserSendWhatsappTemplate: 'cigchat_send_whatsapp_template',
  flowBotUserSendWhatsappTemplateByUserId: 'cigchat_send_whatsapp_template_by_user_id',
  flowBotUserSendFacebookUtilityMessageTemplate: 'cigchat_send_fb_utility_template',
  flowBotUserSendFacebookUtilityMessageTemplateByUserId:
    'cigchat_send_fb_utility_template_by_user_id',

  // Every fan-out tool starts with `broadcast_`.
  flowBotUserBroadcast: 'cigchat_broadcast_to_list',
  flowBotUserBroadcastByTag: 'cigchat_broadcast_by_tag',
  flowBotUserBroadcastBySegment: 'cigchat_broadcast_by_segment',
  flowBotUserBroadcastByUserId: 'cigchat_broadcast_by_user_id',
  flowBotUserBroadcastWhatsappTemplateByTag: 'cigchat_broadcast_whatsapp_template_by_tag',
  flowBotUserBroadcastWhatsappTemplateByUserId: 'cigchat_broadcast_whatsapp_template_by_user_id',
  flowBotUserBroadcastFacebookUtilityMessageTemplateByTag:
    'cigchat_broadcast_fb_utility_template_by_tag',
  flowBotUserBroadcastFacebookUtilityMessageTemplateByUserId:
    'cigchat_broadcast_fb_utility_template_by_user_id',

  flowBotUsers: 'cigchat_search_subscribers',
  flowBotUserInfo: 'cigchat_get_subscriber',
  flowBotUserInfoByUserId: 'cigchat_get_subscriber_by_user_id',
  flowTags: 'cigchat_list_tags',
  flowSubFlows: 'cigchat_list_subflows',
  flowSegment: 'cigchat_list_segments',
  flowEvents: 'cigchat_list_custom_events',
  Products: 'cigchat_list_products',
  Orders: 'cigchat_list_orders',
  Templates: 'cigchat_list_templates',
  Tags: 'cigchat_list_product_tags',
  Types: 'cigchat_list_product_types',
  Vendors: 'cigchat_list_product_vendors',
  Locations: 'cigchat_list_shop_locations',
  DiscountCodes: 'cigchat_list_discount_codes',
  CreateTag: 'cigchat_create_product_tag',
  UpdateTag: 'cigchat_update_product_tag',
  DeleteTag: 'cigchat_delete_product_tag',
  TagGetInfo: 'cigchat_get_product_tag',
};
