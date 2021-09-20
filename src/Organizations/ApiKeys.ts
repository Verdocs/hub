import {Endpoint} from '../HTTP/Transport';
import {IApiKey, IApiKeyWithSecret, ICreateApiKeyRequest, IUpdateApiKeyRequest} from './Types';

/**
 * Get a list of keys for a given organization. The caller must have admin access to the organization.
 *
 * ```typescript
 * import {ApiKeys} from '@verdocs/js-sdk/Organizations';
 *
 * const keys = await ApiKeys.getKeys(ORGID);
 * ```
 */
export const getKeys = (organizationId: string) =>
  Endpoint.get<IApiKey[]>(`/organizations/${organizationId}/api_key`).then((r) => r.data);

/**
 * Create an API key.
 *
 * ```typescript
 * import {ApiKeys} from '@verdocs/js-sdk/Organizations';
 *
 * await ApiKeys.createKey(ORGID, {name: NEWNAME});
 * ```
 */
export const createKey = (organizationId: string, params: ICreateApiKeyRequest) =>
  Endpoint.post<IApiKeyWithSecret>(`/organizations/${organizationId}/api_key`, params).then((r) => r.data);

/**
 * Rotate the secret for an API key. The caller must have admin access to the organization.
 *
 * ```typescript
 * import {ApiKeys} from '@verdocs/js-sdk/Organizations';
 *
 * const {client_secret: newSecret} = await ApiKeys.rotateKey(ORGID, CLIENTID);
 * ```
 */
export const rotateKey = (organizationId: string, clientId: string) =>
  Endpoint.put<IApiKeyWithSecret>(`/organizations/${organizationId}/api_key/${clientId}/rotate`).then((r) => r.data);

/**
 * Update an API key to change its assigned Profile ID or Name.
 *
 * ```typescript
 * import {ApiKeys} from '@verdocs/js-sdk/Organizations';
 *
 * await ApiKeys.updateKey(ORGID, CLIENTID, {name: NEWNAME});
 * ```
 */
export const updateKey = (organizationId: string, clientId: string, params: IUpdateApiKeyRequest) =>
  Endpoint.patch<IApiKey>(`/organizations/${organizationId}/api_key/${clientId}`, params).then((r) => r.data);

/**
 * Delete an API key.
 *
 * ```typescript
 * import {ApiKeys} from '@verdocs/js-sdk/Organizations';
 *
 * await ApiKeys.deleteKey(ORGID, CLIENTID);
 * ```
 */
export const deleteKey = (organizationId: string, clientId: string) =>
  Endpoint.delete(`/organizations/${organizationId}/api_key/${clientId}`).then((r) => r.data);
