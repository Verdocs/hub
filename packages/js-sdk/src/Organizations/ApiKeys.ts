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
 * import {getApiKeys} from '@verdocs/js-sdk';
 *
 * const keys = await getApiKeys(ORGID);
 * ```
 *
 * @group API Keys
 * @api GET /v2/api-keys Get API keys
 * @apiSuccess array(items: IApiKey) . A list of the API keys for the caller's organization. Secrets will not be included.
 */
export const getApiKeys = (endpoint: VerdocsEndpoint) =>
  endpoint.api //
    .get<IApiKey[]>(`/v2/api-keys`)
    .then((r) => r.data);

/**
 * Create an API key.
 *
 * ```typescript
 * import {createApiKey} from '@verdocs/js-sdk';
 *
 * await createApiKey(ORGID, {name: NEWNAME});
 * ```
 *
 * @group API Keys
 * @api POST /v2/api-keys Create API key
 * @apiBody string name A name used to identify the key in the Verdocs Web App
 * @apiBody string(format:uuid) profile_id The profile ID that calls made using the key will act as
 * @apiBody array(items:string) permission An array of permissions to assign to the new key. Extends (but does not override) the API key's profile permissions.
 * @apiSuccess IApiKey . The newly-created API key, including its secret.
 */
export const createApiKey = (endpoint: VerdocsEndpoint, params: ICreateApiKeyRequest) =>
  endpoint.api //
    .post<IApiKey>('/v2/api-keys', params)
    .then((r) => r.data);

/**
 * Rotate the secret for an API key. The caller must have admin access to the organization.
 *
 * ```typescript
 * import {rotateApiKey} from '@verdocs/js-sdk';
 *
 * const {client_secret: newSecret} = await rotateApiKey(ORGID, CLIENTID);
 * ```
 *
 * @group API Keys
 * @api POST /v2/api-keys/:client_id/rotate Rotate API key
 * @apiParam string(format:uuid) client_id The client ID of the key to rotate
 * @apiSuccess IApiKey . The updated API key with its new secret.
 */
export const rotateApiKey = (endpoint: VerdocsEndpoint, clientId: string) =>
  endpoint.api //
    .post<IApiKey>(`/v2/api-keys/${clientId}/rotate`)
    .then((r) => r.data);

/**
 * Update an API key to change its assigned Profile ID or Name.
 *
 * ```typescript
 * import {updateApiKey} from '@verdocs/js-sdk';
 *
 * await updateApiKey(ORGID, CLIENTID, {name: NEWNAME});
 * ```
 *
 * @group API Keys
 * @api PATCH /v2/api-keys/:client_id Update API key
 * @apiBody string name? New name for the API key
 * @apiBody array(items:string) permission New array of permissions to assign to the new key. Extends (but does not override) the API key's profile permissions.
 * @apiSuccess IApiKey . The updated API key. The secret will not be included.
 */
export const updateApiKey = (endpoint: VerdocsEndpoint, clientId: string, params: IUpdateApiKeyRequest) =>
  endpoint.api //
    .patch<IApiKey>(`/v2/api-keys/${clientId}`, params)
    .then((r) => r.data);

/**
 * Delete an API key.
 *
 * ```typescript
 * import {deleteApiKey} from '@verdocs/js-sdk';
 *
 * await deleteApiKey(ORGID, CLIENTID);
 * ```
 *
 * @group API Keys
 * @api DELETE /v2/api-keys/:client_id Delete API key
 * @apiSuccess string . Success.
 */
export const deleteApiKey = (endpoint: VerdocsEndpoint, clientId: string) =>
  endpoint.api //
    .delete(`/v2/api-keys/${clientId}`)
    .then((r) => r.data);
