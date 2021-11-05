/**
 * The Transport Endpoint is a global singleton used to call Verdocs APIs. There can only be one Endpoint per application, and
 * its configuration settings are shared for all callers.
 *
 * @module
 */

import axios, {AxiosInstance} from 'axios';
import globalThis from './globalThis';

const DEFAULTS = {
	baseURL: 'https://api.verdocs.com/',
	timeout: 3000,
	headers: {'X-Client-ID': 'NONE'},
};

// @credit https://derickbailey.com/2016/03/09/creating-a-true-singleton-in-node-js-with-es6-symbols/
// Also see globalThis for comments about why we're doing this in the first place.
const ENDPOINT_KEY = Symbol.for('verdocs-api-endpoint');
if (!globalThis[ENDPOINT_KEY]) {
  globalThis[ENDPOINT_KEY] = axios.create(DEFAULTS);
}
const endpoint = globalThis[ENDPOINT_KEY] as AxiosInstance;

const requestLogger = (r: any) => {
  // tslint:disable-next-line
  console.log(`[JS-SDK] ${r.method.toUpperCase()} ${r.baseURL}${r.url}`, r.data ? JSON.stringify(r.data) : '');
  return r;
};

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
 * Set the base URL for API calls. This defaults to https://api.verdocs.com/ and should only be changed after consultation with
 * Verdocs Developer Support (e.g. to access a private API endpoint).
 *
 * ```typescript
 * import {Transport} from '@verdocs/js-sdk/HTTP';
 *
 * Transport.setBaseUrl('https://my-private-api.verdocs.com');
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
 * Enable or disable request logging. This may expose sensitive data in the console log, so it should only be used for debugging.
 *
 * ```typescript
 * import {Transport} from '@verdocs/js-sdk/HTTP';
 *
 * Transport.logRequests(true);
 * ```
 */
let requestLoggerId = null as number | null;
export const logRequests = (enable: boolean) => {
  if (enable && requestLoggerId === null) {
    requestLoggerId = endpoint.interceptors.request.use(requestLogger);
  } else if (!enable && requestLoggerId !== null) {
    endpoint.interceptors.request.eject(requestLoggerId);
  }
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
