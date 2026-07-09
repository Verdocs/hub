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
 * Get the registered Webhook configuration for the caller's organization. Note that an organization
 * may only have a single Webhook configuration.
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
 * @apiBody string(enum:'none'|'hmac'|'client_credentials') auth_method? Enable HMAC or Client Credentials authentication for Webhooks calls.
 * @apiBody string token_endpoint? Required if `auth_method` is set to `client_credentials`. Token endpoint to use for authenticating Webhooks calls.
 * @apiBody string client_id? Required if `auth_method` is set to `client_credentials`. Client ID to use for authenticating Webhooks calls.
 * @apiBody string client_secret? Required if `auth_method` is set to `client_credentials`. Client secret to use for authenticating Webhooks calls.
 * @apiBody string scope? Optional scope to include in authentication calls if `auth_method` is set to `client_credentials`.
 * @apiBody object events Record<TWebhookEvent, boolean> map of events to enable/disable.
 * @apiSuccess IWebhook . The updated Webhooks config for the caller's organization.
 */
export const setWebhooks = (endpoint: VerdocsEndpoint, params: ISetWebhookRequest) =>
  endpoint.api //
    .patch<IWebhook>(`/v2/webhooks`, params)
    .then((r) => r.data);

/**
 * Rotate the secret key used to authenticate Webhooks. If a secret key has not yet been set,
 * it will be created. Until this is done, Webhook calls will not have a signature applied to
 * their headers. Please note that pending Webhook deliveries will not be affected until the
 * next Webhook is triggered.
 *
 * To authenticate a Webhook call, compute an HMAC-256 hash of the JSON payload `body` field
 * as follows:
 *
 * ```typescript
 *     // NOTE: Hash the `body` field INSIDE the payload. In many frameworks the payload is also called
 *     // `body`, which can be confusing.
 *     const jsonBody = JSON.stringify(req.body.body);
 *     const hash = createHmac('sha256', SECRET_KEY).update(jsonBody).digest('hex');
 *     if (hash !== req.headers['x-webhook-signature']) {
 *       // Handle error here
 *     }
 *
 *     // It is important to return a 200 status code anyway, to avoid the sender trying to resend
 *     // the same data.
 *     res.status(200).send();
 * ```
 *
 * @group Webhooks
 * @api PATCH /v2/webhooks Rotate Webhook secret key
 * @apiDescription Note that Webhooks cannot currently be deleted, but may be easily disabled by setting `active` to `false` and/or setting the `url` to an empty string.
 * @apiSuccess IWebhook . The updated Webhooks config for the caller's organization, including the secret_key.
 */
export const rotateWebhookSecret = (endpoint: VerdocsEndpoint) =>
  endpoint.api //
    .put<IWebhook>(`/v2/webhooks/rotate-secret`)
    .then((r) => r.data);
