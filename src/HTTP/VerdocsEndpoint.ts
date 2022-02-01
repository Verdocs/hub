import axios, {AxiosInstance} from 'axios';

const requestLogger = (r: any) => {
  // tslint:disable-next-line
  console.debug(`[JS-SDK] ${r.method.toUpperCase()} ${r.baseURL}${r.url}`, r.data ? JSON.stringify(r.data) : '');
  return r;
};

/**
 * VerdocsEndpoint is a class wrapper for a specific connection and authorization context for calling the Verdocs APIs.
 * Endpoints can be used for isolated session tasks.
 * For instance, ephemeral signing sessions may be created independently of a caller's status as an authenticated user.
 * In that case, an Endpoint can be created and authenticated, used for calls related to signing operations, then
 * discarded once signing is complete.
 *
 * Note that endpoint configuration functions return the instance, so they can be chained, e.g.
 *
 * ```typescript
 * import {VerdocsEndpoint} from '@verdocs/js-sdk/HTTP';
 *
 * const endpoint = new VerdocsEndpoint();
 * endpoint
 *     .logRequests(true)
 *     .setClientID('1234)
 *     .setTimeout(5000);
 * ```
 */
export class VerdocsEndpoint {
  /**
   * Reference to the axios instance wrapped by this endpoint. This is exposed as a convenience to developers, but
   * developers should generally use the convenience functions such as `setTimeout` to configure the connection.
   * Although there are currently no plans to change from Axios to another XHR library, the less this property is
   * directly accessed the easier future migrations will be.
   */
  api: AxiosInstance;

  private requestLoggerId: number | null = null;

  /**
   * Create a new VerdocsEndpoint to call Verdocs platform services.
   *
   * ```typescript
   * import {VerdocsEndpoint} from '@verdocs/js-sdk/HTTP';
   * const endpoint = new VerdocsEndpoint();
   * ```
   */
  constructor() {
    this.api = axios.create({baseURL: 'https://api.verdocs.com', timeout: 3000});
  }

  /**
   * Set the timeout for API calls in milliseconds. 2000-4000ms is recommended for most purposes. 3000ms is the default.
   *
   * ```typescript
   * import {VerdocsEndpoint} from '@verdocs/js-sdk/HTTP';
   *
   * const endpoint = new VerdocsEndpoint();
   * endpoint.setTimeout(3000);
   * ```
   */
  setTimeout(timeout: number): VerdocsEndpoint {
    this.api.defaults.timeout = timeout;

    return this;
  }

  /**
   * Set the Client ID for Verdocs API calls.
   *
   * ```typescript
   * import {VerdocsEndpoint} from '@verdocs/js-sdk/HTTP';
   *
   * const endpoint = new VerdocsEndpoint();
   * endpoint.setClientID('1234);
   * ```
   */
  setClientID(clientID: string): VerdocsEndpoint {
    this.api.defaults.headers.common['X-Client-ID'] = clientID;

    return this;
  }

  /**
   * Set the auth token that will be used for Verdocs API calls.
   *
   * ```typescript
   * import {VerdocsEndpoint} from '@verdocs/js-sdk/HTTP';
   *
   * const endpoint = new VerdocsEndpoint();
   * endpoint.setAuthorization(accessToken);
   * ```
   */
  setAuthorization(accessToken: string | null): VerdocsEndpoint {
    if (accessToken) {
      this.api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
    } else {
      delete this.api.defaults.headers.common.Authorization;
    }

    return this;
  }

  /**
   * Set the auth token used for signing sessions. Separating user from signing auth allows the same endpoint to be
   * used for multiple operations, although it is recommended that a separate endpoint be created for each operation.
   *
   * ```typescript
   * import {VerdocsEndpoint} from '@verdocs/js-sdk/HTTP';
   *
   * const endpoint = new VerdocsEndpoint();
   * endpoint.setSigningAuthorization(accessToken);
   * ```
   */
  setSigningAuthorization(accessToken: string | null): VerdocsEndpoint {
    if (accessToken) {
      this.api.defaults.headers.common.signer = `Bearer ${accessToken}`;
    } else {
      delete this.api.defaults.headers.common.signer;
    }

    return this;
  }

  /**
   * Set the base URL for API calls. May also be set via the constructor.
   *
   * ```typescript
   * import {VerdocsEndpoint} from '@verdocs/js-sdk/HTTP';
   *
   * const endpoint = new VerdocsEndpoint();
   * endpoint.setBaseURL('https://api.verdocs.com');
   * ```
   */
  setBaseURL(url: string): VerdocsEndpoint {
    this.api.defaults.baseURL = url;
    return this;
  }

  /**
   * Enable or disable request logging. This may expose sensitive data in the console log, so it should only be used for debugging.
   *
   * ```typescript
   * import {VerdocsEndpoint} from '@verdocs/js-sdk/HTTP';
   *
   * const endpoint = new VerdocsEndpoint();
   * endpoint.logRequests(true);
   * ```
   */
  logRequests(enable: boolean): VerdocsEndpoint {
    if (enable && this.requestLoggerId === null) {
      this.requestLoggerId = this.api.interceptors.request.use(requestLogger);
    } else if (!enable && this.requestLoggerId !== null) {
      this.api.interceptors.request.eject(this.requestLoggerId);
    }

    return this;
  }
}
