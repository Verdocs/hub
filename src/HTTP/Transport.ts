import axios, {AxiosInstance} from 'axios';
import globalThis from './globalThis';

// @credit https://derickbailey.com/2016/03/09/creating-a-true-singleton-in-node-js-with-es6-symbols/
// Also see globalThis for comments about why we're doing this in the first place.

const TRACE_ID = Math.floor(Math.random() * 100000);
const ENDPOINT_KEY = Symbol('verdocs-api' + Math.floor(Math.random() * 100000));
const DEFAULTS = {
  baseURL: 'https://api.verdocs.com/',
  timeout: 3000,
  headers: {'X-Client-ID': 'NONE'},
};

if (!globalThis[ENDPOINT_KEY]) {
	// tslint:disable-next-line
  console.log('[JS-SDK] Creating endpoint', TRACE_ID, ENDPOINT_KEY);
  globalThis[ENDPOINT_KEY] = axios.create(DEFAULTS);
} else {
	// tslint:disable-next-line
  console.log('[JS-SDK] Using existing endpoint', TRACE_ID, ENDPOINT_KEY);
}

const endpoint = globalThis[ENDPOINT_KEY] as AxiosInstance;

// TODO: Remove these once done debugging
// tslint:disable-next-line
console.log('[JS-SDK] Created API Endpoint', TRACE_ID, ENDPOINT_KEY);
endpoint.interceptors.request.use((r: any) => {
  // tslint:disable-next-line
  console.log(
    `[JS-SDK] ${TRACE_ID} :: ${r.method.toUpperCase()}  ${r.url}`,
    JSON.stringify(r.data),
    JSON.stringify(r.headers),
  );
  return r;
});

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
  if (accessToken) {
    endpoint.defaults.headers.Authorization = `Bearer ${accessToken}`;
  } else {
    delete endpoint.defaults.headers.Authorization;
  }
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
  endpoint.defaults.headers['X-Client-ID'] = clientID;
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
  endpoint.defaults.baseURL = baseUrl;
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
  endpoint.defaults.timeout = timeout;
};

/**
 * Helper to get the endpoint for direct access to HTTP functions.
 *
 * ```typescript
 * import {Transport} from '@verdocs/js-sdk/HTTP';
 *
 * console.log('Current timeout', Transport.getEndpoint().defaults.timeout);
 * ```
 */
export const getEndpoint = () => {
  return endpoint;
};
