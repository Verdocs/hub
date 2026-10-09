/**
 * Webhooks are callback triggers from Verdocs to your servers that notify your applications
 * of various events, such as signing operations. Each delivery is a POST whose JSON body is
 * `{id, event, created_at, organization_id, data}`. Failed deliveries will be retried up to
 * 12 times.
 *
 * @module
 */

import {IListWebhookDeliveriesParams, ISetWebhookRequest, IWebhookDeliveriesResponse, IWebhookDelivery, IWebhookDeliveryDetail, IWebhookDeliveryStats} from './Types';
import {VerdocsEndpoint} from '../VerdocsEndpoint';
import {IWebhook} from '../Models';

/**
 * Get the registered Webhook configuration for the caller's organization. `client_secret` and 
 * `secret_key` will be masked as "..." plus their last 4 characters.
 *
 * ```typescript
 * import {getWebhooks} from '@verdocs/js-sdk';
 *
 * const webhook = await getWebhooks(VerdocsEndpoint.getDefault());
 * ```
 *
 * @group Webhooks
 * @api GET /v2/webhooks Get organization webhooks config
 * @apiSuccess IWebhook . The current webhooks config for the caller's organization.
 *
 * @sdkOperation webhook.getWebhooks
 * @sdkGroup Webhook
 * @sdkPage Endpoints
 */
export const getWebhooks = (endpoint: VerdocsEndpoint) =>
  endpoint.api //
    .get<IWebhook>(`/v2/webhooks`)
    .then((r) => r.data);

/**
 * Update the registered Webhook configuration for the caller's organization. Note that
 * Webhooks cannot currently be deleted, but may be easily disabled by setting `active`
 * to `false` and/or setting the `url` to an empty string. Secrets will be masked, and
 * to prevent misdtakes, sending a masked `client_secret` to the API will leave the
 * current entry unchanged.
 *
 * ```typescript
 * import {setWebhooks} from '@verdocs/js-sdk';
 *
 * const endpoint = VerdocsEndpoint.getDefault();
 * const {events} = await getWebhooks(endpoint);
 * await setWebhooks(endpoint, {url: 'https://example.com/webhooks', active: true, auth_method: 'hmac', events: {...events, envelope_completed: true}});
 * ```
 *
 * @group Webhooks
 * @api PATCH /v2/webhooks Update organization webhooks config
 * @apiDescription Note that Webhooks cannot currently be deleted, but may be easily disabled by setting `active` to `false` and/or setting the `url` to an empty string.
 * @apiBody string url URL to send Webhook events to. An empty or invalid URL will disable Webhook calls.
 * @apiBody boolean active Set to true to enable Webhooks calls.
 * @apiBody string(enum:'none'|'hmac'|'client_credentials') auth_method? Enable HMAC or Client Credentials authentication for Webhooks calls.
 * @apiBody string token_endpoint? Required if `auth_method` is set to `client_credentials`. Token endpoint to use for authenticating Webhooks calls.
 * @apiBody string client_id? Required if `auth_method` is set to `client_credentials`. Client ID to use for authenticating Webhooks calls.
 * @apiBody string client_secret? Required if `auth_method` is set to `client_credentials`. Client secret to use for authenticating Webhooks calls.
 * @apiBody string scope? Optional scope to include in authentication calls if `auth_method` is set to `client_credentials`.
 * @apiBody object events Record<TWebhookEvent, boolean> map of events to enable/disable.
 * @apiSuccess IWebhook . The updated webhooks config for the caller's organization.
 *
 * @sdkOperation webhook.setWebhooks
 * @sdkGroup Webhook
 * @sdkPage Endpoints
 */
export const setWebhooks = (endpoint: VerdocsEndpoint, params: ISetWebhookRequest) =>
  endpoint.api //
    .patch<IWebhook>(`/v2/webhooks`, params)
    .then((r) => r.data);

/**
 * Rotate the secret key used to authenticate Webhooks. If a secret key has not yet been set, it 
 * will be created. This is the only call that returns the secret in full.
 *
 * ```typescript
 * import {rotateWebhookSecret} from '@verdocs/js-sdk';
 *
 * await rotateWebhookSecret(VerdocsEndpoint.getDefault());
 * ```
 *
 * To authenticate a Webhook call, compute an HMAC-SHA256 hex digest of the payload's `data`
 * field, serialized with `JSON.stringify`, and compare it to the `x-webhook-signature` header:
 *
 * ```typescript
 * const jsonBody = JSON.stringify(req.body.data);
 * const hash = createHmac('sha256', SECRET_KEY).update(jsonBody).digest('hex');
 * if (hash !== req.headers['x-webhook-signature']) {
 *   // Handle error here
 * }
 *
 * // Return 200 even on verification failure so the sender does not retry the same delivery.
 * res.status(200).send();
 * ```
 *
 * @group Webhooks
 * @api PUT /v2/webhooks/rotate-secret Rotate Webhook secret key
 * @apiDescription Rotates (or first creates) the secret used to sign webhook deliveries. The response includes the new, unmasked `secret_key`. Deliveries sent after the rotation, including retries, use the new secret.
 * @apiSuccess IWebhook . The updated webhooks config for the caller's organization, including the secret_key.
 *
 * @sdkOperation webhook.rotateWebhookSecret
 * @sdkGroup Webhook
 * @sdkPage Endpoints
 */
export const rotateWebhookSecret = (endpoint: VerdocsEndpoint) =>
  endpoint.api //
    .put<IWebhook>(`/v2/webhooks/rotate-secret`)
    .then((r) => r.data);

/**
 * List the organization's webhook deliveries, newest first. Deliveries are (currently) kept for 90 days.
 *
 * ```typescript
 * import {getWebhookDeliveries} from '@verdocs/js-sdk';
 *
 * const {count, deliveries} = await getWebhookDeliveries(VerdocsEndpoint.getDefault(), {status: 'failed'});
 * ```
 *
 * @group Webhooks
 * @api GET /v2/webhooks/deliveries List webhook deliveries
 * @apiQuery string event? Only deliveries for this event
 * @apiQuery string envelope_id? Only deliveries about this envelope
 * @apiQuery string(enum:'delivered'|'failed'|'pending') status? Only deliveries in this state
 * @apiQuery string(format:date-time) created_after? Only deliveries created at or after this time
 * @apiQuery string(format:date-time) created_before? Only deliveries created before this time
 * @apiQuery integer(default: 25) rows? Page size, up to 100
 * @apiQuery integer(default: 0) page? Page to retrieve (0-based)
 * @apiSuccess integer(format: int32) count The total number of matching deliveries
 * @apiSuccess integer(format: int32) rows The page size used
 * @apiSuccess integer(format: int32) page The page returned
 * @apiSuccess array(items: IWebhookDelivery) deliveries The deliveries on this page
 *
 * @sdkOperation webhook.getWebhookDeliveries
 * @sdkGroup Webhook
 * @sdkPage Endpoints
 */
export const getWebhookDeliveries = (endpoint: VerdocsEndpoint, params?: IListWebhookDeliveriesParams) =>
  endpoint.api //
    .get<IWebhookDeliveriesResponse>(`/v2/webhooks/deliveries`, {params})
    .then((r) => r.data);

/**
 * Get daily delivery counts by status for the last `days` days (UTC), oldest first. Days with no
 * deliveries are included with zero counts.
 *
 * ```typescript
 * import {getWebhookDeliveryStats} from '@verdocs/js-sdk';
 *
 * const days = await getWebhookDeliveryStats(VerdocsEndpoint.getDefault(), 14);
 * ```
 *
 * @group Webhooks
 * @api GET /v2/webhooks/deliveries/stats Get webhook delivery counts
 * @apiQuery integer(default: 30) days? How many days to include, up to 90
 * @apiSuccess array(items: IWebhookDeliveryStats) . One entry per day
 *
 * @sdkOperation webhook.getWebhookDeliveryStats
 * @sdkGroup Webhook
 * @sdkPage Endpoints
 */
export const getWebhookDeliveryStats = (endpoint: VerdocsEndpoint, days?: number) =>
  endpoint.api //
    .get<IWebhookDeliveryStats[]>(`/v2/webhooks/deliveries/stats`, {params: days ? {days} : {}})
    .then((r) => r.data);

/**
 * Get one webhook delivery, including its payload (`data`).
 *
 * ```typescript
 * import {getWebhookDelivery} from '@verdocs/js-sdk';
 *
 * const delivery = await getWebhookDelivery(VerdocsEndpoint.getDefault(), deliveryId);
 * ```
 *
 * @group Webhooks
 * @api GET /v2/webhooks/deliveries/:delivery_id Get a webhook delivery
 * @apiParam string(format:uuid) delivery_id The delivery to get
 * @apiSuccess IWebhookDeliveryDetail . The delivery with its payload and last response
 *
 * @sdkOperation webhook.getWebhookDelivery
 * @sdkGroup Webhook
 * @sdkPage Endpoints
 */
export const getWebhookDelivery = (endpoint: VerdocsEndpoint, deliveryId: string) =>
  endpoint.api //
    .get<IWebhookDeliveryDetail>(`/v2/webhooks/deliveries/${deliveryId}`)
    .then((r) => r.data);

/**
 * Retry a Webhook delivery.
 *
 * ```typescript
 * import {resendWebhookDelivery} from '@verdocs/js-sdk';
 *
 * const {status} = await resendWebhookDelivery(VerdocsEndpoint.getDefault(), deliveryId);
 * ```
 *
 * @group Webhooks
 * @api POST /v2/webhooks/deliveries/:delivery_id/resend Resend a webhook delivery
 * @apiParam string(format:uuid) delivery_id The delivery to send again
 * @apiSuccess IWebhookDelivery . The delivery after the attempt
 *
 * @sdkOperation webhook.resendWebhookDelivery
 * @sdkGroup Webhook
 * @sdkPage Endpoints
 */
export const resendWebhookDelivery = (endpoint: VerdocsEndpoint, deliveryId: string) =>
  endpoint.api //
    .post<IWebhookDelivery>(`/v2/webhooks/deliveries/${deliveryId}/resend`)
    .then((r) => r.data);
