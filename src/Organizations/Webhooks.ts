/**
 * Webhooks are callback triggers from Verdocs to your servers that notify your applications
 * of various events, such as signing operations.
 *
 * @module
 */

import {VerdocsEndpoint} from '../VerdocsEndpoint';
import {ISetWebhookRequest} from './Types';
import {IWebhook} from '../Models';

/**
 * Get the registered Webhook configuration for the caller's organization.
 *
 * ```typescript
 * import {getWebhooks} from '@verdocs/js-sdk';
 *
 * await getWebhooks(ORGID, params);
 * ```
 *
 * @group Webhooks
 * @api GET /v2/webhooks Get organization Webhooks config
 * @apiSuccess IWebhook . The current Webhooks config for the caller's organization.
 */
export const getWebhooks = (endpoint: VerdocsEndpoint) =>
  endpoint.api //
    .get<IWebhook>(`/v2/webhooks`)
    .then((r) => r.data);

/**
 * Update the registered Webhook configuration for the caller's organization. Note that
 * Webhooks cannot currently be deleted, but may be easily disabled by setting `active`
 * to `false` and/or setting the `url` to an empty string.
 *
 * ```typescript
 * import {setWebhooks} from '@verdocs/js-sdk';
 *
 * await setWebhooks(ORGID, params);
 * ```
 *
 * @group Webhooks
 * @api PATCH /v2/webhooks Update organization Webhooks config
 * @apiDescription Note that Webhooks cannot currently be deleted, but may be easily disabled by setting `active` to `false` and/or setting the `url` to an empty string.
 * @apiBody string url URL to send Webhook events to. An empty or invalid URL will disable Webhook calls.
 * @apiBody boolean active Set to true to enable Webhooks calls.
 * @apiBody object events Record<TWebhookEvent, boolean> map of events to enable/disable.
 * @apiSuccess IWebhook . The updated Webhooks config for the caller's organization.
 */
export const setWebhooks = (endpoint: VerdocsEndpoint, params: ISetWebhookRequest) =>
  endpoint.api //
    .patch<IWebhook>(`/v2/webhooks`, params)
    .then((r) => r.data);
