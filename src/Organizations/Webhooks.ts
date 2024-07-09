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
 * Get the registered Webhooks for the caller's organization.
 */
export const getWebhooks = (endpoint: VerdocsEndpoint) =>
  endpoint.api //
    .get<IWebhook>(`/v2/webhooks/organization`)
    .then((r) => r.data);

/**
 * Update the registered Webhooks for the caller's organization.
 */
export const setWebhooks = (endpoint: VerdocsEndpoint, params: ISetWebhookRequest) =>
  endpoint.api //
    .patch<IWebhook>(`/v2/webhooks/organization`, params)
    .then((r) => r.data);
