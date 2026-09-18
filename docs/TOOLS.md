# Tool reference

_Generated from the cig.chat OpenAPI spec — do not edit by hand._

**249 tools** across **11 toolsets**, wrapping 249 API operations.

| Tier | Tools | Meaning |
| --- | ---: | --- |
| `read` | 86 | Reads data. No state change. |
| `write` | 102 | Reversible change. |
| `send` | 17 | Delivers a message to one person. |
| `broadcast` | 8 | Delivers to many. Confirmation required. |
| `destructive` | 36 | Irreversible. Confirmation required. |

## Subscribers — `subscribers` (40)

Find, create and update subscribers; tags, labels, fields, opt-in state.

| Tool | Tier | Endpoint | Description |
| --- | --- | --- | --- |
| `cigchat_get_subscriber` | read | `GET /subscriber/get-info` | Get subscriber info |
| `cigchat_get_subscriber_by_user_id` | read | `GET /subscriber/get-info-by-user-id` | Get subscriber info by user unique id from channel, e.g. Facebook user id, WhatsApp user id, WeChat user id... |
| `cigchat_search_subscribers` | read | `GET /subscribers` | Get list of subscribers by seaching for name, phone, email, tag, custom user field and so on. |
| `cigchat_subscriber_add_labels_by_name` | write | `POST /subscriber/add-labels-by-name` | Add labels by label name to subscriber, up to 20 labels |
| `cigchat_subscriber_add_tag` | write | `POST /subscriber/add-tag` | Add tag to subscriber |
| `cigchat_subscriber_add_tag_by_name` | write | `POST /subscriber/add-tag-by-name` | Add tag to subscriber by tag name |
| `cigchat_subscriber_add_tags` | write | `POST /subscriber/add-tags` | Add tags to subscriber, up to 20 tags |
| `cigchat_subscriber_add_tags_by_name` | write | `POST /subscriber/add-tags-by-name` | Add tags by tag name to subscriber, up to 20 tags |
| `cigchat_subscriber_assign_agent` | write | `POST /subscriber/assign-agent` | Assign agent to chat |
| `cigchat_subscriber_assign_agent_group` | write | `POST /subscriber/assign-agent-group` | Assign agent group to chat |
| `cigchat_subscriber_chat_messages` | read | `GET /subscriber/chat-messages` | Get list of subscriber chat messages. type: in -> Incoming message from bot user, out -> Ougoing message from bot, agent -> Outgoing message |
| `cigchat_subscriber_chat_messages_by_mids` | read | `POST /subscriber/chat-messages-by-mids` | Get chat messages by multiple mids, up to 100 mids. type: in -> Incoming message from bot user, out -> Ougoing message from bot, agent -> Ou |
| `cigchat_subscriber_clear_user_field` | write | `DELETE /subscriber/clear-user-field` | Clear subscriber user field value |
| `cigchat_subscriber_clear_user_field_by_name` | write | `DELETE /subscriber/clear-user-field-by-name` | Clear subscriber user field value by field name |
| `cigchat_subscriber_clear_user_fields` | write | `DELETE /subscriber/clear-user-fields` | Clear multiple subscriber user fields, up to 20 user fields |
| `cigchat_subscriber_clear_user_fields_by_name` | write | `DELETE /subscriber/clear-user-fields-by-name` | Clear multiple subscriber user fields, up to 20 user fields |
| `cigchat_subscriber_create` | write | `POST /subscriber/create` | Create new subscriber, phone or email is required |
| `cigchat_subscriber_create_many` | write | `POST /subscriber/create-many` | Create new subscribers, phone or email is required |
| `cigchat_subscriber_delete` | destructive | `DELETE /subscriber/delete` | Delete subscriber |
| `cigchat_subscriber_log_custom_event` | send | `POST /subscriber/log-custom-event` | Log custom event |
| `cigchat_subscriber_move_chat_to` | write | `POST /subscriber/move-chat-to` | Update chat status |
| `cigchat_subscriber_opt_in_email` | write | `POST /subscriber/opt-in-email` | Opt-in Email |
| `cigchat_subscriber_opt_in_sms` | write | `POST /subscriber/opt-in-sms` | Opt-in SMS |
| `cigchat_subscriber_opt_out_email` | write | `DELETE /subscriber/opt-out-email` | Opt-out Email |
| `cigchat_subscriber_opt_out_sms` | write | `DELETE /subscriber/opt-out-sms` | Opt-out SMS |
| `cigchat_subscriber_pause_bot` | write | `POST /subscriber/pause-bot` | Pause bot automation to subscriber |
| `cigchat_subscriber_remove_labels_by_name` | write | `DELETE /subscriber/remove-labels-by-name` | Remove labels from subscriber by label name, up to 20 labels |
| `cigchat_subscriber_remove_tag` | write | `DELETE /subscriber/remove-tag` | Remove tag from subscriber |
| `cigchat_subscriber_remove_tag_by_name` | write | `DELETE /subscriber/remove-tag-by-name` | Remove tag from subscriber by tag name |
| `cigchat_subscriber_remove_tags` | write | `DELETE /subscriber/remove-tags` | Remove tags from subscriber, up to 20 tags |
| `cigchat_subscriber_remove_tags_by_name` | write | `DELETE /subscriber/remove-tags-by-name` | Remove tags from subscriber by tag name, up to 20 tags |
| `cigchat_subscriber_resume_bot` | write | `POST /subscriber/resume-bot` | Resume bot automation to subscriber |
| `cigchat_subscriber_set_user_field` | write | `PUT /subscriber/set-user-field` | Set or update subscriber user field value |
| `cigchat_subscriber_set_user_field_by_name` | write | `PUT /subscriber/set-user-field-by-name` | Set or update subscriber user field value by field name |
| `cigchat_subscriber_set_user_fields` | write | `PUT /subscriber/set-user-fields` | Set or update subscriber multiple user field value, up to 20 user fields |
| `cigchat_subscriber_set_user_fields_by_name` | write | `PUT /subscriber/set-user-fields-by-name` | Set or update subscriber multiple user field value, up to 20 user fields |
| `cigchat_subscriber_subscribe_to_bot` | write | `POST /subscriber/subscribe-to-bot` | Subscribe to bot |
| `cigchat_subscriber_unassign_agent` | write | `POST /subscriber/unassign-agent` | Unassign agent from chat |
| `cigchat_subscriber_unsubscribe_from_bot` | write | `DELETE /subscriber/unsubscribe-from-bot` | Unsubscribe from bot |
| `cigchat_subscriber_update` | write | `PUT /subscriber/update` | Update subscriber data |

## Flow — `flow` (44)

Sub-flows, tags, user fields, bot fields, shortcuts, closing notes, segments.

| Tool | Tier | Endpoint | Description |
| --- | --- | --- | --- |
| `cigchat_flow_agents` | read | `GET /flow/agents` | Get list of agents |
| `cigchat_flow_bot_fields` | read | `GET /flow/bot-fields` | Get list of bot fields by flow |
| `cigchat_flow_bot_users_count` | read | `GET /flow/bot-users-count` | Get count of bot users status |
| `cigchat_flow_chat_button_widgets` | read | `GET /flow/chat-button-widgets` | Get list of chat button widgets |
| `cigchat_flow_create_bot_field` | write | `POST /flow/create-bot-field` | create new bot field |
| `cigchat_flow_create_closing_note` | write | `POST /flow/create-closing-note` | Create a closing note for the current flow |
| `cigchat_flow_create_shortcut` | write | `POST /flow/create-shortcut` | Create a shortcut for the current flow |
| `cigchat_flow_create_tag` | write | `POST /flow/create-tag` | create new tag |
| `cigchat_flow_create_user_field` | write | `POST /flow/create-user-field` | create new user field |
| `cigchat_flow_custom_events_data` | read | `GET /flow/custom-events/data` | Get the flow custom event data |
| `cigchat_flow_custom_events_summary` | read | `GET /flow/custom-events/summary` | Get the flow custom event summary |
| `cigchat_flow_delete_bot_field` | destructive | `DELETE /flow/delete-bot-field` | Delete bot field |
| `cigchat_flow_delete_bot_field_by_name` | destructive | `DELETE /flow/delete-bot-field-by-name` | Delete bot field by name |
| `cigchat_flow_delete_closing_note` | destructive | `DELETE /flow/delete-closing-note` | Delete a closing note from the current flow |
| `cigchat_flow_delete_shortcut` | destructive | `DELETE /flow/delete-shortcut` | Delete a shortcut from the current flow |
| `cigchat_flow_delete_sub_flow` | destructive | `DELETE /flow/delete-sub-flow` | Delete sub flow |
| `cigchat_flow_delete_tag` | destructive | `DELETE /flow/delete-tag` | Delete tag |
| `cigchat_flow_delete_tag_by_name` | destructive | `DELETE /flow/delete-tag-by-name` | Delete tag by tag name |
| `cigchat_flow_delete_user_field` | destructive | `DELETE /flow/delete-user-field` | Delete user field |
| `cigchat_flow_delete_user_field_by_name` | destructive | `DELETE /flow/delete-user-field-by-name` | Delete user field by name |
| `cigchat_flow_error_logs_data` | read | `GET /flow/error-logs/data` | Get error logs for the current flow. |
| `cigchat_flow_inbound_webhooks` | read | `GET /flow/inbound-webhooks` | Get list of inbound webhooks by flow |
| `cigchat_flow_set_bot_field` | write | `PUT /flow/set-bot-field` | update bot field value |
| `cigchat_flow_set_bot_field_by_name` | write | `PUT /flow/set-bot-field-by-name` | update bot field value by bot field name |
| `cigchat_flow_set_bot_fields` | write | `PUT /flow/set-bot-fields` | update multiple bot fields value, up to 20 bot fields |
| `cigchat_flow_set_bot_fields_by_name` | write | `PUT /flow/set-bot-fields-by-name` | update multiple bot fields value by field name, up to 20 bot fields |
| `cigchat_flow_set_default_start_flow` | write | `POST /flow/set-default-start-flow` | Set default bot start flow, use main to reset the start flow to main flow |
| `cigchat_flow_set_web_chat_widget_default_start_flow` | write | `POST /flow/set-web-chat-widget-default-start-flow` | Set default start flow for web chat widget, use main to set the start flow to main flow |
| `cigchat_flow_settings_get_default_ai_provider` | read | `GET /flow/settings/get-default-ai-provider` | Get default ai provider and model, available ai_provider: openai, deepseek, xai, claude, gemini, groq, ainvented |
| `cigchat_flow_settings_set_audio_transcription` | write | `POST /flow/settings/set-audio-transcription` | Set audio transcription, available values: none,whisper-1,gpt-4o-transcribe,gpt-4o-mini-transcribe,whisper-large-v3-turbo,gemini-2.5-flash,g |
| `cigchat_flow_settings_set_default_ai_provider` | write | `POST /flow/settings/set-default-ai-provider` | Set default ai provider and model, available ai_provider: openai, deepseek, xai, claude, gemini, groq, ainvented |
| `cigchat_flow_template_installs` | read | `GET /flow/template-installs` | Get list of template installs in this flow |
| `cigchat_flow_update_closing_note` | write | `PUT /flow/update-closing-note` | Update a closing note in the current flow |
| `cigchat_flow_update_shortcut` | write | `PUT /flow/update-shortcut` | Update a shortcut in the current flow |
| `cigchat_flow_update_user_field` | write | `POST /flow/update-user-field` | Update user field name or display_type |
| `cigchat_flow_user_fields` | read | `GET /flow/user-fields` | Get list of user fields by flow |
| `cigchat_get_closing_note` | read | `GET /flow/closing-notes/{id}` | Get a closing note from the current flow |
| `cigchat_get_shortcut` | read | `GET /flow/shortcuts/{id}` | Get a shortcut from the current flow |
| `cigchat_list_closing_notes` | read | `GET /flow/closing-notes` | Get closing notes for the current flow |
| `cigchat_list_custom_events` | read | `GET /flow/custom-events` | Get list of custom events by flow |
| `cigchat_list_segments` | read | `GET /flow/segments` | Get list of segments by flow |
| `cigchat_list_shortcuts` | read | `GET /flow/shortcuts` | Get shortcuts for the current flow |
| `cigchat_list_subflows` | read | `GET /flow/subflows` | Get list of sub flows |
| `cigchat_list_tags` | read | `GET /flow/tags` | Get list of tags by flow |

## Conversations — `conversations` (2)

Conversation history and agent activity.

| Tool | Tier | Endpoint | Description |
| --- | --- | --- | --- |
| `cigchat_flow_agent_activity_log_data` | read | `GET /flow/agent-activity-log/data` | Get the flow agent activity log data |
| `cigchat_flow_conversations_data` | read | `GET /flow/conversations/data` | Get the flow conversation data, only return the closed conversations |

## WhatsApp & Meta templates — `whatsapp` (8)

WhatsApp and Facebook utility message templates.

| Tool | Tier | Endpoint | Description |
| --- | --- | --- | --- |
| `cigchat_facebook_utility_message_template_create` | write | `POST /facebook-utility-message-template/create` | Create Facebook utility message template |
| `cigchat_facebook_utility_message_template_delete` | destructive | `DELETE /facebook-utility-message-template/delete` | Delete Facebook utility message template |
| `cigchat_facebook_utility_message_template_list` | read | `POST /facebook-utility-message-template/list` | List Facebook utility message templates |
| `cigchat_facebook_utility_message_template_sync` | write | `POST /facebook-utility-message-template/sync` | Sync Facebook utility message templates |
| `cigchat_whatsapp_template_create` | write | `POST /whatsapp-template/create` | Create Whatsapp template, check https://developers.facebook.com/docs/graph-api/reference/whats-app-business-account/message_templates/#Creat |
| `cigchat_whatsapp_template_delete` | destructive | `DELETE /whatsapp-template/delete` | Delete Whatsapp template |
| `cigchat_whatsapp_template_list` | read | `POST /whatsapp-template/list` | List Whatsapp templates |
| `cigchat_whatsapp_template_sync` | write | `POST /whatsapp-template/sync` | Sync Whatsapp templates |

## Messaging — `messaging` (24)

Send to one subscriber, or broadcast to many. Handle with care.

| Tool | Tier | Endpoint | Description |
| --- | --- | --- | --- |
| `cigchat_broadcast_by_segment` | broadcast | `POST /subscriber/broadcast-by-segment` | Broadcast sub flow by segments, available types: EMAIL,SMS,WHATSAPP_TEMPLATE,FACEBOOK_NOTIFICATION |
| `cigchat_broadcast_by_tag` | broadcast | `POST /subscriber/broadcast-by-tag` | Broadcast sub flow by tags, available types: EMAIL,SMS,WHATSAPP_TEMPLATE,FACEBOOK_NOTIFICATION |
| `cigchat_broadcast_by_user_id` | broadcast | `POST /subscriber/broadcast-by-user-id` | Broadcast sub flow by user ids, available types: EMAIL,SMS,WHATSAPP_TEMPLATE,FACEBOOK_NOTIFICATION |
| `cigchat_broadcast_fb_utility_template_by_tag` | broadcast | `POST /subscriber/broadcast-facebook-utility-message-template-by-tag` | Broadcast Facebook utility message template by tags |
| `cigchat_broadcast_fb_utility_template_by_user_id` | broadcast | `POST /subscriber/broadcast-facebook-utility-message-template-by-user-id` | Broadcast Facebook utility message template by user ids |
| `cigchat_broadcast_to_list` | broadcast | `POST /subscriber/broadcast` | Broadcast sub flow by user ns list, available types: EMAIL,SMS,WHATSAPP_TEMPLATE,FACEBOOK_NOTIFICATION |
| `cigchat_broadcast_whatsapp_template_by_tag` | broadcast | `POST /subscriber/broadcast-whatsapp-template-by-tag` | Broadcast whatsapp template by tags, you can find the namespace, name, lang, params from /api/whatapp-template/list, use use_default_values  |
| `cigchat_broadcast_whatsapp_template_by_user_id` | broadcast | `POST /subscriber/broadcast-whatsapp-template-by-user-id` | Broadcast whatsapp template by user ids, you can find the namespace, name, lang, params from /api/whatapp-template/list, use use_default_val |
| `cigchat_cancel_broadcast` | destructive | `DELETE /subscriber/broadcast/cancel` | Cancel all pending recipients of a new, scheduled, or sending broadcast in the current flow. |
| `cigchat_delete_broadcast` | destructive | `DELETE /subscriber/broadcast/delete` | Delete a cancelled broadcast and its recipient records from the current flow. |
| `cigchat_list_broadcasts` | read | `GET /subscriber/broadcasts` | Get broadcasts in the current flow. Filter by the stored broadcast status when required. |
| `cigchat_send_content` | send | `POST /subscriber/send-content` | Send content to subscriber, learn more about how to use dynamic content |
| `cigchat_send_email` | send | `POST /subscriber/send-email` | Send email content to subscriber |
| `cigchat_send_fb_utility_template` | send | `POST /subscriber/send-facebook-utility-message-template` | Send Facebook utility message template to subscriber |
| `cigchat_send_fb_utility_template_by_user_id` | send | `POST /subscriber/send-facebook-utility-message-template-by-user-id` | Send Facebook utility message template to subscriber by user id |
| `cigchat_send_main_flow` | send | `POST /subscriber/send-main-flow` | Send main flow to subscriber |
| `cigchat_send_node` | send | `POST /subscriber/send-node` | Send node to subscriber |
| `cigchat_send_sms` | send | `POST /subscriber/send-sms` | Send sms content to subscriber |
| `cigchat_send_subflow` | send | `POST /subscriber/send-sub-flow` | Send sub flow to subscriber |
| `cigchat_send_subflow_by_name` | send | `POST /subscriber/send-sub-flow-by-flow-name` | Send sub flow to subscriber by flow name |
| `cigchat_send_subflow_by_user_id` | send | `POST /subscriber/send-sub-flow-by-user-id` | Send sub flow to subscriber by the unique user id from each channel |
| `cigchat_send_text` | send | `POST /subscriber/send-text` | Send text content to subscriber |
| `cigchat_send_whatsapp_template` | send | `POST /subscriber/send-whatsapp-template` | Send Whatsapp Template to subscriber, you can find the namespace, name, lang, params from /api/whatapp-template/list |
| `cigchat_send_whatsapp_template_by_user_id` | send | `POST /subscriber/send-whatsapp-template-by-user-id` | Send Whatsapp Template to subscriber, you can find the namespace, name, lang, params from /api/whatapp-template/list |

## Shop — `shop` (49)

Products, variants, types, vendors, tags, orders, discounts, locations, carts.

| Tool | Tier | Endpoint | Description |
| --- | --- | --- | --- |
| `cigchat_create_product_tag` | write | `POST /shop/product-tags/create` | Create new tag |
| `cigchat_delete_product_tag` | destructive | `DELETE /shop/product-tags/{tagId}/delete` | Delete tag |
| `cigchat_get_product_tag` | read | `GET /shop/product-tags/{tagId}/get-info` | Get tag info |
| `cigchat_list_discount_codes` | read | `GET /shop/discount-codes` | Get list of discount codes |
| `cigchat_list_orders` | read | `GET /shop/orders` | Get list of orders |
| `cigchat_list_product_tags` | read | `GET /shop/product-tags` | Get list of product tags |
| `cigchat_list_product_types` | read | `GET /shop/product-types` | Get list of product types |
| `cigchat_list_product_vendors` | read | `GET /shop/product-vendors` | Get list of product vendors |
| `cigchat_list_products` | read | `GET /shop/products` | Get list of products |
| `cigchat_list_shop_locations` | read | `GET /shop/locations` | Get list of locations |
| `cigchat_shop_business_hours_info` | read | `GET /shop/business-hours/info` | Get store business hours |
| `cigchat_shop_business_hours_update` | write | `PUT /shop/business-hours/update` | Update store business hours. id, available values: 1, 2, 3, 4, 5, 6, 7 name, available values: Monday, Tuesday, Wednesday, Thursday, Friday, |
| `cigchat_shop_discount_codes_create` | write | `POST /shop/discount-codes/create` | Create new tag |
| `cigchat_shop_discount_codes_delete` | destructive | `DELETE /shop/discount-codes/{codeId}/delete` | Delete discount code |
| `cigchat_shop_discount_codes_delete_by_code` | destructive | `DELETE /shop/discount-codes/delete-by-code` | Delete discount code by code |
| `cigchat_shop_discount_codes_get_info` | read | `GET /shop/discount-codes/{codeId}/get-info` | Get discount code info |
| `cigchat_shop_discount_codes_get_info_by_code` | read | `GET /shop/discount-codes/get-info-by-code` | Get discount code info by code |
| `cigchat_shop_discount_codes_update` | write | `PUT /shop/discount-codes/{codeId}/update` | Update discount code. |
| `cigchat_shop_locations_create` | write | `POST /shop/locations/create` | Create new location |
| `cigchat_shop_locations_delete` | destructive | `DELETE /shop/locations/{locationId}/delete` | Delete location |
| `cigchat_shop_locations_get_info` | read | `GET /shop/locations/{locationId}/get-info` | Get lcoation info |
| `cigchat_shop_locations_update` | write | `PUT /shop/locations/{locationId}/update` | Update location. |
| `cigchat_shop_orders_create` | write | `POST /shop/orders/create` | Create new order for bot user |
| `cigchat_shop_orders_get_info` | read | `GET /shop/orders/{orderId}/get-info` | Get order info |
| `cigchat_shop_orders_update` | write | `PUT /shop/orders/{orderId}/update` | Update order |
| `cigchat_shop_product_types_create` | write | `POST /shop/product-types/create` | Create new type |
| `cigchat_shop_product_types_delete` | destructive | `DELETE /shop/product-types/{typeId}/delete` | Delete type |
| `cigchat_shop_product_types_get_info` | read | `GET /shop/product-types/{typeId}/get-info` | Get type info |
| `cigchat_shop_product_types_update` | write | `PUT /shop/product-types/{typeId}/update` | Update type name. |
| `cigchat_shop_product_vendors_create` | write | `POST /shop/product-vendors/create` | Create new vendor |
| `cigchat_shop_product_vendors_delete` | destructive | `DELETE /shop/product-vendors/{vendorId}/delete` | Delete vendor |
| `cigchat_shop_product_vendors_get_info` | read | `GET /shop/product-vendors/{vendorId}/get-info` | Get vendor info |
| `cigchat_shop_product_vendors_update` | write | `PUT /shop/product-vendors/{vendorId}/update` | Update vendor name. |
| `cigchat_shop_products_create` | write | `POST /shop/products/create` | Create new product |
| `cigchat_shop_products_delete` | destructive | `DELETE /shop/products/{productId}/delete` | Delete product |
| `cigchat_shop_products_get_info` | read | `GET /shop/products/{productId}/get-info` | Get product info |
| `cigchat_shop_products_update` | write | `PUT /shop/products/{productId}/update` | Update product info only. To update variants, use /shop/products/update-variant |
| `cigchat_shop_products_variants` | read | `GET /shop/products/{productId}/variants` | Get list of product variants |
| `cigchat_shop_products_variants_create` | write | `POST /shop/products/{productId}/variants/create` | Create new product variant |
| `cigchat_shop_products_variants_delete` | destructive | `DELETE /shop/products/{productId}/variants/{variantId}/delete` | Delete product variant |
| `cigchat_shop_products_variants_get_info` | read | `GET /shop/products/{productId}/variants/{variantId}/get-info` | Get product variant info |
| `cigchat_shop_products_variants_update` | write | `PUT /shop/products/{productId}/variants/{variantId}/update` | Update product variant info |
| `cigchat_subscriber_add_to_cart` | write | `POST /subscriber/add-to-cart` | Add item to subscriber shopping cart |
| `cigchat_subscriber_cart` | read | `GET /subscriber/cart` | Get subscriber shopping cart detail |
| `cigchat_subscriber_cart_paid` | send | `POST /subscriber/cart-paid` | Checkout subscriber shopping cart and mark as paid |
| `cigchat_subscriber_empty_cart` | write | `DELETE /subscriber/empty-cart` | Empty subscriber shopping cart items |
| `cigchat_subscriber_remove_from_cart` | write | `DELETE /subscriber/remove-from-cart` | Remove item from subscriber shopping cart |
| `cigchat_subscriber_update_order_status` | send | `POST /subscriber/update-order-status` | Update order status to paid,ordered,processing,shipped,completed,cancelled,refunded |
| `cigchat_update_product_tag` | write | `PUT /shop/product-tags/{tagId}/update` | Update tag name. |

## Team — `team` (19)

Ticket lists, team labels and agent groups.

| Tool | Tier | Endpoint | Description |
| --- | --- | --- | --- |
| `cigchat_team_agent_group` | read | `GET /team/agent-group/{id}` | Get agent group information and members |
| `cigchat_team_agent_groups` | read | `GET /team/agent-groups` | Get list of Agent Groups |
| `cigchat_team_create_agent_group` | write | `POST /team/create-agent-group` | create new agent group |
| `cigchat_team_create_label` | write | `POST /team/create-label` | create new label |
| `cigchat_team_delete_agent_group` | destructive | `DELETE /team/delete-agent-group/{id}` | Delete agent group |
| `cigchat_team_delete_label` | destructive | `DELETE /team/delete-label` | Delete label |
| `cigchat_team_delete_label_by_name` | destructive | `DELETE /team/delete-label-by-name` | Delete label by label name |
| `cigchat_team_labels` | read | `GET /team/labels` | Get list of labels |
| `cigchat_team_ticket_item_add_comment` | write | `POST /team/ticket-lists/{listId}/items/{listItemId}/comments` | Add a comment and optional attachment URL to a ticket |
| `cigchat_team_ticket_item_comments` | read | `GET /team/ticket-lists/{listId}/items/{listItemId}/comments` | Get comments and attachment URLs for a ticket |
| `cigchat_team_ticket_lists` | read | `GET /team/ticket-lists` | Get list of ticket lists |
| `cigchat_team_ticket_lists_create` | write | `POST /team/ticket-lists/{listId}/create` | create new ticket |
| `cigchat_team_ticket_lists_delete` | destructive | `DELETE /team/ticket-lists/{listId}/delete/{listItemId}` | delete a ticket |
| `cigchat_team_ticket_lists_fields` | read | `GET /team/ticket-lists/{listId}/fields` | Get list of ticket list fields |
| `cigchat_team_ticket_lists_items` | read | `GET /team/ticket-lists/{listId}/items` | Get list of ticket list items |
| `cigchat_team_ticket_lists_log_data` | read | `GET /team/ticket-lists/{listId}/log-data` | Get the ticket list change log data |
| `cigchat_team_ticket_lists_update` | write | `PUT /team/ticket-lists/{listId}/update/{listItemId}` | update a ticket, include only the fields that need to be changed |
| `cigchat_team_update_agent_group` | write | `PUT /team/update-agent-group/{id}` | update agent group |
| `cigchat_team_update_agent_group_users` | write | `POST /team/update-agent-group-users/{id}` | update agent group members |

## AI — `ai` (13)

AI agents and tasks, provider settings, OpenAI embeddings.

| Tool | Tier | Endpoint | Description |
| --- | --- | --- | --- |
| `cigchat_flow_ai_agent_info` | read | `POST /flow/ai-agent-info` | View Ai Agent details, including description, prompts, ai function list and more |
| `cigchat_flow_ai_agents` | read | `GET /flow/ai-agents` | Get list of ai agents by flow |
| `cigchat_flow_ai_task_info` | read | `POST /flow/ai-task-info` | View Ai Task details |
| `cigchat_flow_ai_tasks` | read | `GET /flow/ai-tasks` | Get list of ai tasks by flow |
| `cigchat_flow_update_ai_agent_provider` | write | `POST /flow/update-ai-agent-provider` | update Ai Agent provider and model, available ai_provider: openai, openai-responses, deepseek, xai, xai-responses, claude, gemini, groq, ain |
| `cigchat_flow_update_ai_task_provider` | write | `POST /flow/update-ai-task-provider` | update Ai Task provider and model, available ai_provider: openai, deepseek, xai, claude, gemini, groq, ainvented |
| `cigchat_openai_embeddings` | read | `GET /openai-embeddings` | Get list of OpenAI Embeddings |
| `cigchat_openai_embeddings_create` | write | `POST /openai-embeddings/create` | Create new embedding |
| `cigchat_openai_embeddings_delete` | destructive | `DELETE /openai-embeddings/{id}/delete` | Delete embedding |
| `cigchat_openai_embeddings_generate` | write | `POST /openai-embeddings/generate` | Regenerate embeddings |
| `cigchat_openai_embeddings_get_info` | read | `GET /openai-embeddings/{id}/get-info` | Get embedding info |
| `cigchat_openai_embeddings_import` | write | `POST /openai-embeddings/import` | Import OpenAI Embeddings, maximum 100 embeddings, max characters for each heading is 50, max characters for each text is 1000 |
| `cigchat_openai_embeddings_update` | write | `PUT /openai-embeddings/{id}/update` | Update embeding heading and text. |

## Integrations — `integrations` (30)

Third-party integration credentials and mini-apps.

| Tool | Tier | Endpoint | Description |
| --- | --- | --- | --- |
| `cigchat_clear_integration_ainvented` | destructive | `DELETE /integration/ainvented` | Clear the config of Ainvented integration |
| `cigchat_clear_integration_calude` | destructive | `DELETE /integration/calude` | Clear the config of CaludeAi integration |
| `cigchat_clear_integration_dropi` | destructive | `DELETE /integration/dropi` | Clear the config of Dropi integration |
| `cigchat_clear_integration_meta_conversions_api` | destructive | `DELETE /integration/meta-conversions-api` | Clear the config of Meta Conversions Api integration |
| `cigchat_clear_integration_openai` | destructive | `DELETE /integration/openai` | Clear the config of OpenAi integration |
| `cigchat_clear_integration_s3storage` | destructive | `DELETE /integration/s3storage` | Clear the config of S3 Storage integration |
| `cigchat_clear_integration_shopify` | destructive | `DELETE /integration/shopify` | Clear the config of shopify integration |
| `cigchat_clear_integration_woocommerce` | destructive | `DELETE /integration/woocommerce` | Clear the config of WooCommerce integration |
| `cigchat_clear_integration_xai` | destructive | `DELETE /integration/xai` | Clear the config of XAi integration |
| `cigchat_get_integration_ainvented` | read | `GET /integration/ainvented` | Get the config of Ainvented integration |
| `cigchat_get_integration_dropi` | read | `GET /integration/dropi` | Get the config of Dropi integration |
| `cigchat_get_integration_meta_conversions_api` | read | `GET /integration/meta-conversions-api` | Get the config of Meta Conversions Api integration |
| `cigchat_get_integration_openai` | read | `GET /integration/openai` | Get the config of OpenAi integration |
| `cigchat_get_integration_s3storage` | read | `GET /integration/s3storage` | Get the config of S3 Storage integration |
| `cigchat_get_integration_shopify` | read | `GET /integration/shopify` | Get the config of shopify integration |
| `cigchat_get_integration_woocommerce` | read | `GET /integration/woocommerce` | Get the config of WooCommerce integration |
| `cigchat_get_integration_xai` | read | `GET /integration/xai` | Get the config of XAi integration |
| `cigchat_installed_mini_app_list` | read | `GET /installed-mini-app/list` | Get the list of installed mini apps |
| `cigchat_installed_mini_app_update_api_key` | write | `POST /installed-mini-app/update-api-key/{app_id}` | Update the config of Installed mini app, only for the mini app with auth type apikey |
| `cigchat_integration_claude` | read | `GET /integration/claude` | Get the config of CaludeAi integration |
| `cigchat_set_integration_ainvented` | write | `POST /integration/ainvented` | Update the config of Ainvented integration |
| `cigchat_set_integration_calude` | write | `POST /integration/calude` | Update the config of CaludeAi integration |
| `cigchat_set_integration_dropi` | write | `POST /integration/dropi` | Update the config of Dropi integration |
| `cigchat_set_integration_meta_conversions_api` | write | `POST /integration/meta-conversions-api` | Update the config of Meta Conversions Api integration |
| `cigchat_set_integration_openai` | write | `POST /integration/openai` | Update the config of OpenAi integration |
| `cigchat_set_integration_s3storage` | write | `POST /integration/s3storage` | Update the config of S3 Storage integration |
| `cigchat_set_integration_shopify` | write | `POST /integration/shopify` | Update the config of shopify integration. For new custom app integration after 2026-02-01, use Client ID value in the api_key field, use Cli |
| `cigchat_set_integration_woocommerce` | write | `POST /integration/woocommerce` | Update the config of WooCommerce integration |
| `cigchat_set_integration_xai` | write | `POST /integration/xai` | Update the config of XAi integration |
| `cigchat_subscriber_app_trigger` | send | `POST /subscriber/app-trigger` | Trigger an app event on subscriber from installed min-app |

## Workspace — `workspace` (17)

Workspace settings, members, analytics and account info.

| Tool | Tier | Endpoint | Description |
| --- | --- | --- | --- |
| `cigchat_announcements_read` | write | `POST /announcements/read` | Mark announcement as read |
| `cigchat_flow_agent_summary` | read | `GET /flow-agent-summary` | Get the flow agent summary |
| `cigchat_flow_summary` | read | `GET /flow-summary` | Get the flow summary |
| `cigchat_me` | read | `GET /me` | Get current user info |
| `cigchat_media_library` | read | `GET /media-library` | Get member-uploaded media |
| `cigchat_notifications_read` | write | `POST /notifications/read` | Mark notification as read |
| `cigchat_notifications_recent` | read | `GET /notifications/recent` | Get recent notifications and announcements |
| `cigchat_team_bot_users` | read | `GET /team-bot-users` | Get list of bot users by seaching for name, phone, email and so on. |
| `cigchat_team_flows` | read | `GET /team-flows` | Get list of workspace bots |
| `cigchat_team_info` | read | `GET /team-info` | Get workspace info |
| `cigchat_team_members` | read | `GET /team-members` | Get list of workspace members |
| `cigchat_user_change_password` | write | `PUT /user/change-password` | Change user password |
| `cigchat_wa_call_logs` | read | `GET /wa-call-logs` | Get paginated WhatsApp call logs for the workspace |
| `cigchat_workspace_settings_channels` | read | `GET /workspace-settings/channels` | Get workspace settings - Channels |
| `cigchat_workspace_settings_live_chat_sidebar` | read | `GET /workspace-settings/live-chat-sidebar` | Get workspace settings - Live Chat Sidebar |
| `cigchat_workspace_settings_update_channels` | write | `POST /workspace-settings/update-channels` | Show/Hide workspace Channels |
| `cigchat_workspace_settings_update_live_chat_sidebar` | write | `POST /workspace-settings/update-live-chat-sidebar` | Update the workspace settings for live chat sidebar, available values: single_bot_style,disable_sidebar,hide_unanswered,hide_my_groups,hide_ |

## Templates — `templates` (3)

Flow templates and one-time install links.

| Tool | Tier | Endpoint | Description |
| --- | --- | --- | --- |
| `cigchat_list_templates` | read | `GET /templates` | Get list of templates |
| `cigchat_template_generate_one_time_link` | write | `POST /template/{templateNs}/generate-one-time-link` | Generate template one time install link |
| `cigchat_template_installs` | read | `GET /template/{templateNs}/installs` | Get list of installs by template ns |

