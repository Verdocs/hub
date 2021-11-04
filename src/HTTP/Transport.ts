import axios from 'axios';

const config = {
  baseURL: 'https://api.verdocs.com/',
  timeout: 3000,
  headers: {'X-Client-ID': 'NONE'} as Record<string, string>,
};
let endpoint = axios.create(config);

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
    config.headers['Authorization'] = `Bearer ${accessToken}`;
  } else {
    delete config.headers['Authorization'];
  }

  if (endpoint) {
    endpoint = axios.create(config);
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
  config.headers['X-Client-ID'] = clientID;
  if (endpoint) {
    endpoint = axios.create(config);
  }
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
  config.baseURL = baseUrl;
  if (endpoint) {
    endpoint = axios.create(config);
  }
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
  config.timeout = timeout;
  if (endpoint) {
    endpoint = axios.create(config);
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
  if (!endpoint) {
    endpoint = axios.create(config);
  }

  return endpoint;
};
