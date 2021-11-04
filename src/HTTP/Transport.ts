import axios from 'axios';

// TODO: This is only for debugging purposes
export const Endpoint = axios.create({
  baseURL: 'https://api.verdocs.com/',
  timeout: 3000,
  headers: {'X-Client-ID': 'NONE'},
});
console.log('[JS-SDK] Created endpoint', Endpoint);

/**
 * Set the auth token that will be used for Verdocs API calls.
 *
 * ```typescript
 * import {Transport} from '@verdocs/js-sdk/HTTP';
 *
 * Transport.setAuthorization(accessToken);
 * ```
 */
export const setAuthorization = (accessToken: string | null) => {
  Endpoint.defaults.headers.Authorization = `Bearer ${accessToken}`;
};

/**
 * Set the Client ID for Verdocs API calls.
 *
 * ```typescript
 * import {Transport} from '@verdocs/js-sdk/HTTP';
 *
 * Transport.setClientID('1234);
 * ```
 */
export const setClientID = (clientID: string) => {
  Endpoint.defaults.headers['X-Client-ID'] = clientID;
};

/**
 * Set the base URL for API calls. Typically this is https://api.verdocs.com/ and is the default. Change this only after consultation
 * with Verdocs Developer Support.
 *
 * ```typescript
 * import {Transport} from '@verdocs/js-sdk/HTTP';
 *
 * Transport.setBaseUrl('https://api.verdiocs.com');
 * ```
 */
export const setBaseUrl = (baseUrl: string) => {
  Endpoint.defaults.baseURL = baseUrl;
};

/**
 * Set the timeout for API calls in milliseconds. 2000-4000ms is recommended for most purposes. 3000ms is the default.
 *
 * ```typescript
 * import {Transport} from '@verdocs/js-sdk/HTTP';
 *
 * Transport.setTimeout(3000);
 * ```
 */
export const setTimeout = (timeout: number) => {
  Endpoint.defaults.timeout = timeout;
};

/**
 * Helper to get the endpoint rather than directly accessing the exported object.
 *
 * ```typescript
 * import {Transport} from '@verdocs/js-sdk/HTTP';
 *
 * console.log('Current timeout', Transport.getEndpoint().defaults.timeout);
 * ```
 */
export const getEndpoint = () => {
  return Endpoint;
};
