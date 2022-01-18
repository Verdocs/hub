/**
 * A VerdocsEndpoint is a specific connection and authorization session for calling the Verdocs APIs. Where the global
 * Transport is generally used to simpliy standard-user operations, Endpoints can be used for isolated session tasks.
 * For instance, ephemeral signing sessions may be created independently of a caller's status as an authenticated user.
 * In that case, an Endpoint can be created and authenticated, used for calls related to signing operations, then
 * discarded once signing is complete.
 *
 * @module
 */

import axios, {AxiosInstance} from 'axios';

const requestLogger = (r: any) => {
  // tslint:disable-next-line
  console.log(`[JS-SDK] ${r.method.toUpperCase()} ${r.baseURL}${r.url}`, r.data ? JSON.stringify(r.data) : '');
  return r;
};

export class VerdocsEndpoint {
  api: AxiosInstance;

  requestLoggerId: number | null = null;

  /**
   * Create a new Endpoint to call Verdocs services.
   *
   * ```typescript
   * import {Endpoint} from '@verdocs/js-sdk/HTTP';
   *
   * console.log('Current timeout', Transport.getEndpoint().defaults.timeout);
   * ```
   */
  constructor({baseURL, timeout}: {baseURL?: string; timeout?: number} = {}) {
    this.api = axios.create({
      baseURL: baseURL || 'https://api.verdocs.com',
      timeout: timeout || 6000,
    });
  }

  /**
   * Set the timeout for API calls in milliseconds. 2000-4000ms is recommended for most purposes. 3000ms is the default.
   *
   * ```typescript
   * import {Endpoint} from '@verdocs/js-sdk/HTTP';
   *
   * const endpoint = new Endpoint();
   * endpoint.setTimeout(3000);
   * ```
   */
  setTimeout(timeout: number) {
    this.api.defaults.timeout = timeout;
  }

  /**
   * Set the Client ID for Verdocs API calls.
   *
   * ```typescript
   * import {Endpoint} from '@verdocs/js-sdk/HTTP';
   *
   * const endpoint = new Endpoint();
   * endpoint.setClientID('1234);
   * ```
   */
  setClientID(clientID: string) {
    this.api.defaults.headers['X-Client-ID'] = clientID;
  }

  /**
   * Set the auth token that will be used for Verdocs API calls.
   *
   * ```typescript
   * import {Endpoint} from '@verdocs/js-sdk/HTTP';
   *
   * const endpoint = new Endpoint();
   * endpoint.setAuthorization(accessToken);
   * ```
   */
  setAuthorization(accessToken: string | null) {
    if (accessToken) {
      this.api.defaults.headers.Authorization = `Bearer ${accessToken}`;
    } else {
      delete this.api.defaults.headers.Authorization;
    }
  }

  /**
   * Set the auth token used for signing sessions. Separating user from signing auth allows the same endpoint to be
   * used for multiple operations, although it is recommended that a separate endpoint be created for each operation.
   *
   * ```typescript
   * import {Endpoint} from '@verdocs/js-sdk/HTTP';
   *
   * const endpoint = new Endpoint();
   * endpoint.setSigningAuthorization(accessToken);
   * ```
   */
  setSigningAuthorization(accessToken: string | null) {
    if (accessToken) {
      this.api.defaults.headers.signer = `Bearer ${accessToken}`;
    } else {
      delete this.api.defaults.headers.signer;
    }
  }

  /**
   * Set the base URL for API calls. May also be set via the constructor.
   *
   * ```typescript
   * import {Endpoint} from '@verdocs/js-sdk/HTTP';
   *
   * const endpoint = new Endpoint();
   * endpoint.setBaseURL('https://api.verdocs.com');
   * ```
   */
  setBaseURL(url: string) {
    this.api.defaults.baseURL = url;
  }

  /**
   * Enable or disable request logging. This may expose sensitive data in the console log, so it should only be used for debugging.
   *
   * ```typescript
   * import {Endpoint} from '@verdocs/js-sdk/HTTP';
   *
   * const endpoint = new Endpoint();
   * endpoint.logRequests(true);
   * ```
   */
  logRequests(enable: boolean) {
    if (enable && this.requestLoggerId === null) {
      this.requestLoggerId = this.api.interceptors.request.use(requestLogger);
    } else if (!enable && this.requestLoggerId !== null) {
      this.api.interceptors.request.eject(this.requestLoggerId);
    }
  }
}
