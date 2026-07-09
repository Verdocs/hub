/**
 * Notification Templates allow organizations to customize the email and SMS notifications
 * sent during signing workflows. Each template is tied to a specific event (e.g. recipient invited,
 * envelope completed) and notification type (email, sms, etc). The caller must have admin access
 * to the organization.
 *
 * @module
 */

import {ICreateNotificationTemplateRequest, IUpdateNotificationTemplateRequest} from './Types';
import {VerdocsEndpoint} from '../VerdocsEndpoint';
import {INotificationTemplate} from '../Models';

/**
 * Get all notification templates for the caller's organization.
 *
 * ```typescript
 * import {getNotificationTemplates} from '@verdocs/js-sdk';
 *
 * const templates = await getNotificationTemplates();
 * ```
 *
 * @group Notifications
 * @api GET /v2/notifications/templates Get notification templates
 * @apiSuccess array(items: INotificationTemplate) . A list of notification templates for the caller's organization.
 */
export const getNotificationTemplates = (endpoint: VerdocsEndpoint) =>
  endpoint.api //
    .get<INotificationTemplate[]>(`/v2/notifications/templates`)
    .then((r) => r.data);

/**
 * Get a single notification template by ID.
 *
 * ```typescript
 * import {getNotificationTemplate} from '@verdocs/js-sdk';
 *
 * const template = await getNotificationTemplate(TEMPLATEID);
 * ```
 *
 * @group Notifications
 * @api GET /v2/notifications/templates/:id Get notification template
 * @apiParam string(format:uuid) id The notification template ID
 * @apiSuccess INotificationTemplate . The requested notification template.
 */
export const getNotificationTemplate = (endpoint: VerdocsEndpoint, id: string) =>
  endpoint.api //
    .get<INotificationTemplate>(`/v2/notifications/templates/${id}`)
    .then((r) => r.data);

/**
 * Create a notification template. Only one template may exist per combination of type and
 * event_name. At least one of `html_template` or `text_template` must be provided.
 *
 * ```typescript
 * import {createNotificationTemplate} from '@verdocs/js-sdk';
 *
 * const template = await createNotificationTemplate({
 *   type: 'email',
 *   event_name: 'recipient:invited',
 *   html_template: '<p>You have been invited to sign a document.</p>',
 * });
 * ```
 *
 * @group Notifications
 * @api POST /v2/notifications/templates Create notification template
 * @apiBody string(enum:'sms'|'email'|'app') type The notification channel type.
 * @apiBody string event_name The event that triggers this notification.
 * @apiBody string template_id? Optional reference to an associated template.
 * @apiBody string html_template? The HTML content for the notification. At least one of html_template or text_template is required.
 * @apiBody string text_template? The plain-text content for the notification. At least one of html_template or text_template is required.
 * @apiSuccess INotificationTemplate . The newly-created notification template.
 */
export const createNotificationTemplate = (endpoint: VerdocsEndpoint, params: ICreateNotificationTemplateRequest) =>
  endpoint.api //
    .post<INotificationTemplate>(`/v2/notifications/templates`, params)
    .then((r) => r.data);

/**
 * Update a notification template. At least one of `html_template` or `text_template` must be provided.
 *
 * ```typescript
 * import {updateNotificationTemplate} from '@verdocs/js-sdk';
 *
 * const updated = await updateNotificationTemplate(TEMPLATEID, {
 *   html_template: '<p>Updated content.</p>',
 * });
 * ```
 *
 * @group Notifications
 * @api PATCH /v2/notifications/templates/:id Update notification template
 * @apiParam string(format:uuid) id The notification template ID
 * @apiBody string html_template? The HTML content for the notification. At least one of html_template or text_template is required.
 * @apiBody string text_template? The plain-text content for the notification. At least one of html_template or text_template is required.
 * @apiSuccess INotificationTemplate . The updated notification template.
 */
export const updateNotificationTemplate = (endpoint: VerdocsEndpoint, id: string, params: IUpdateNotificationTemplateRequest) =>
  endpoint.api //
    .patch<INotificationTemplate>(`/v2/notifications/templates/${id}`, params)
    .then((r) => r.data);

/**
 * Delete a notification template.
 *
 * ```typescript
 * import {deleteNotificationTemplate} from '@verdocs/js-sdk';
 *
 * await deleteNotificationTemplate(TEMPLATEID);
 * ```
 *
 * @group Notification Templates
 * @api DELETE /v2/notifications/templates/:id Delete notification template
 * @apiParam string(format:uuid) id The notification template ID
 * @apiSuccess string . Success.
 */
export const deleteNotificationTemplate = (endpoint: VerdocsEndpoint, id: string) =>
  endpoint.api //
    .delete(`/v2/notifications/templates/${id}`)
    .then((r) => r.data);
