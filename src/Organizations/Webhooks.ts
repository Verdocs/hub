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
 */
export const setWebhooks = (endpoint: VerdocsEndpoint, params: ISetWebhookRequest) =>
  endpoint.api //
    .patch<IWebhook>(`/v2/webhooks`, params)
    .then((r) => r.data);
