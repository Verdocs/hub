/**
 * API keys are used to authenticate server-to-server calls. (API keys should **never** be used for client-to-server operations!)
 * To generate a key, either use the Verdocs admin interface and make note of the client_id and client_secret generated, or call
 * createKey as shown below. Then call {@link Users.Auth.authenticateApp} to obtain an access token using the provided ID and
 * secret. Note that server-to-server authentication requests return shorter-lived tokens, so it is important to check the `exp`
 * field and re-authenticate as needed for subsequent calls.
 *
 * API keys may be updated or rotated at any time. Regular rotation is recommended. Rotation will not expire or invalidate
 * existing server-to-server sessions, so it may be done at any time without disrupting your application.
 *
 * @module
 */

import {ICreateApiKeyRequest, IUpdateApiKeyRequest} from './Types';
import {VerdocsEndpoint} from '../VerdocsEndpoint';
import {IApiKey} from '../Models';

/**
 * Get a list of keys for a given organization. The caller must have admin access to the organization.
 *
 * ```typescript
 * import {ApiKeys} from '@verdocs/js-sdk';
 *
 * const keys = await ApiKeys.getKeys(ORGID);
 * ```
 */
export const getApiKeys = (endpoint: VerdocsEndpoint) =>
  endpoint.api //
    .get<IApiKey[]>(`/v2/api-keys`)
    .then((r) => r.data);

/**
 * Create an API key.
 *
 * ```typescript
 * import {ApiKeys} from '@verdocs/js-sdk';
 *
 * await ApiKeys.createKey(ORGID, {name: NEWNAME});
 * ```
 */
export const createApiKey = (endpoint: VerdocsEndpoint, params: ICreateApiKeyRequest) =>
  endpoint.api //
    .post<IApiKey>('/v2/api-keys', params)
    .then((r) => r.data);

/**
 * Rotate the secret for an API key. The caller must have admin access to the organization.
 *
 * ```typescript
 * import {ApiKeys} from '@verdocs/js-sdk';
 *
 * const {client_secret: newSecret} = await ApiKeys.rotateKey(ORGID, CLIENTID);
 * ```
 */
export const rotateApiKey = (endpoint: VerdocsEndpoint, clientId: string) =>
  endpoint.api //
    .post<IApiKey>(`/v2/api-keys/${clientId}/rotate`)
    .then((r) => r.data);

/**
 * Update an API key to change its assigned Profile ID or Name.
 *
 * ```typescript
 * import {ApiKeys} from '@verdocs/js-sdk';
 *
 * await ApiKeys.updateKey(ORGID, CLIENTID, {name: NEWNAME});
 * ```
 */
export const updateApiKey = (endpoint: VerdocsEndpoint, clientId: string, params: IUpdateApiKeyRequest) =>
  endpoint.api //
    .patch<IApiKey>(`/v2/api-keys/${clientId}`, params)
    .then((r) => r.data);

/**
 * Delete an API key.
 *
 * ```typescript
 * import {ApiKeys} from '@verdocs/js-sdk';
 *
 * await ApiKeys.deleteKey(ORGID, CLIENTID);
 * ```
 */
export const deleteApiKey = (endpoint: VerdocsEndpoint, clientId: string) =>
  endpoint.api //
    .delete(`/v2/api-keys/${clientId}`)
    .then((r) => r.data);
