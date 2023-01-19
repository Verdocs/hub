import axios, {AxiosInstance} from 'axios';
import {TSession, TSessionType} from './Sessions/Types';
import {decodeAccessTokenBody} from './Utils/Token';
import globalThis from './Utils/globalThis';

// @credit https://derickbailey.com/2016/03/09/creating-a-true-singleton-in-node-js-with-es6-symbols/
// Also see globalThis for comments about why we're doing this in the first place.
const ENDPOINT_KEY = Symbol.for('verdocs-default-endpoint');

const requestLogger = (r: any) => {
  // tslint:disable-next-line
  console.debug(`[JS-SDK] ${r.method.toUpperCase()} ${r.baseURL}${r.url}`, r.data ? JSON.stringify(r.data) : '');
  return r;
};

export type TEnvironment = 'verdocs' | 'verdocs-stage';

export type TSessionChangedListener = (endpoint: VerdocsEndpoint, session: TSession) => void;

export interface VerdocsEndpointOptions {
  baseURL?: string;
  timeout?: number;
  environment?: TEnvironment;
  sessionType?: TSessionType;
  clientID?: string;
}

/**
 * VerdocsEndpoint is a class wrapper for a specific connection and authorization context for calling the Verdocs APIs.
 * Endpoints can be used for isolated session tasks.
 *
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
 *     .setSessionType('signing')
 *     .logRequests(true)
 *     .setClientID('1234)
 *     .setTimeout(5000);
 * ```
 */
export class VerdocsEndpoint {
  private environment = 'verdocs' as TEnvironment;
  private sessionType = 'user' as TSessionType;
  private readonly baseURL = 'https://api.verdocs.com' as string;
  private clientID = 'not-set' as string;
  private timeout = 15000 as number;
  private token = null as string | null;
  private nextListenerId = 0;
  private sessionListeners = new Map<symbol, TSessionChangedListener>();
  private requestLoggerId: number | null = null;

  /**
   * The current user session, or null if not authenticated. May be either a User or Signing session. If set, the
   * presence of the `document_id` field can be used to differentiate the types. Only signing sessions are associated
   * with Envelopes.
   */
  public session = null as TSession;

  public api: AxiosInstance;

  /**
   * Create a new VerdocsEndpoint to call Verdocs platform services.
   *
   * ```typescript
   * import {VerdocsEndpoint} from '@verdocs/js-sdk/HTTP';
   * const endpoint = new VerdocsEndpoint();
   * ```
   */
  constructor(options?: VerdocsEndpointOptions) {
    this.baseURL = options?.baseURL || 'https://api.verdocs.com';
    this.timeout = options?.timeout || 15000;
    this.environment = options?.environment || 'verdocs';
    this.sessionType = options?.sessionType || 'user';
    this.clientID = options?.clientID || 'not-set';
    this.api = axios.create({baseURL: this.baseURL, timeout: this.timeout});
  }

  public setDefault() {
    globalThis[ENDPOINT_KEY] = this;
  }

  public static getDefault(): VerdocsEndpoint {
    if (!globalThis[ENDPOINT_KEY]) {
      globalThis[ENDPOINT_KEY] = new VerdocsEndpoint();
      window.console.debug('[JS_SDK] Created default endpoint', globalThis[ENDPOINT_KEY]);
    }

    return globalThis[ENDPOINT_KEY];
  }

  /**
   * Get the current environment.
   */
  public getEnvironment() {
    return this.environment;
  }

  /**
   * Get the current session type.
   */
  public getSessionType() {
    return this.sessionType;
  }

  /**
   * Get the current base URL. This should rarely be anything other than 'https://api.verdocs.com'.
   */
  public getBaseURL() {
    return this.baseURL;
  }

  /**
   * Get the current client ID, if set.
   */
  public getClientID() {
    return this.clientID;
  }

  /**
   * Get the current timeout.
   */
  public getTimeout() {
    return this.timeout;
  }

  /**
   * Get the current session, if any.
   */
  public getSession() {
    return this.session;
  }

  /**
   * Set the operating environment. This should rarely be anything other than 'verdocs'.
   *
   * ```typescript
   * import {VerdocsEndpoint} from '@verdocs/js-sdk/HTTP';
   *
   * const endpoint = new VerdocsEndpoint();
   * endpoint.setEnvironment('verdocs-stage');
   * ```
   */
  public setEnvironment(environment: TEnvironment): VerdocsEndpoint {
    this.environment = environment;
    return this;
  }

  /**
   * Set the session type. In general this should be done immediately when the endpoint is created. Changing the
   * session type may be done at any time, but may have unintended consequences if the endpoint is shared between
   * multiple widgets.
   *
   * Changing the session type will clear/reload the action session. This may trigger notifications to session state
   * observers. Apps that use observers to trigger UI updates such as logging the user out should be prepared to
   * handle this event.
   *
   * ```typescript
   * import {VerdocsEndpoint} from '@verdocs/js-sdk/HTTP';
   *
   * const endpoint = new VerdocsEndpoint();
   * endpoint.setEnvironment('verdocs-stage');
   * ```
   */
  public setSessionType(sessionType: TSessionType): VerdocsEndpoint {
    this.sessionType = sessionType;
    return this;
  }

  /**
   * Set the base URL for API calls. Should be called only upon direction from Verdocs Customer Solutions Engineering.
   *
   * ```typescript
   * import {VerdocsEndpoint} from '@verdocs/js-sdk/HTTP';
   *
   * const endpoint = new VerdocsEndpoint();
   * endpoint.setBaseURL('https://api.verdocs.com');
   * ```
   */
  public setBaseURL(url: string): VerdocsEndpoint {
    this.api.defaults.baseURL = url;
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
    this.clientID = clientID;
    this.api.defaults.headers.common['X-Client-ID'] = clientID;
    return this;
  }

  /**
   * Set the timeout for API calls in milliseconds. 5000-20000ms is recommended for most purposes. 15000ms is the default.
   * Note that some calls may involve rendering operations that require some time to complete, so very short timeouts
   * are not recommended.
   *
   * ```typescript
   * import {VerdocsEndpoint} from '@verdocs/js-sdk/HTTP';
   *
   * const endpoint = new VerdocsEndpoint();
   * endpoint.setTimeout(3000);
   * ```
   */
  public setTimeout(timeout: number): VerdocsEndpoint {
    this.timeout = timeout;
    this.api.defaults.timeout = timeout;
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
  public logRequests(enable: boolean): VerdocsEndpoint {
    if (enable && this.requestLoggerId === null) {
      this.requestLoggerId = this.api.interceptors.request.use(requestLogger);
    } else if (!enable && this.requestLoggerId !== null) {
      this.api.interceptors.request.eject(this.requestLoggerId);
    }

    return this;
  }

  /**
   * Set the authorization token that will be used for Verdocs API calls. This will also set the session metadata
   * and notify any listeners of the new data.
   *
   * If this Endpoint will be used for non-default purposes (e.g. signing, or in an alternate environment) those
   * settings should be made before calling this. Sessions are persisted to localStorage, and the environment and
   * type become part of the storage key.
   *
   * ```typescript
   * import {VerdocsEndpoint} from '@verdocs/js-sdk/HTTP';
   *
   * const endpoint = new VerdocsEndpoint();
   * endpoint.setToken(accessToken);
   * ```
   */
  public setToken(token: string | null): VerdocsEndpoint {
    if (!token) {
      return this.clearSession();
    }

    const session = decodeAccessTokenBody(token);
    if (session === null || (session.exp && session.exp * 1000 < new Date().getTime())) {
      window.console.warn('[JS_SDK] Ignoring attempt to use expired session token');
      return this.clearSession();
    }

    this.token = token;
    this.session = session;
    if (this.sessionType === 'user') {
      this.api.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      this.api.defaults.headers.common.signer = `Bearer ${token}`;
    }

    localStorage.setItem(this.sessionStorageKey(), token);

    this.notifySessionListeners();
    return this;
  }

  /**
   * Retrieves the current session token, if any. Tokens should rarely be used for direct actions, but this is
   * required by the `<VerdocsView>` and other components to authorize requests to raw PDF files.
   */
  public getToken() {
    return this.token;
  }

  private sessionStorageKey() {
    return `verdocs-session-${this.getSessionType()}-${this.getEnvironment()}`;
  }

  /**
   * Clear the active session.
   */
  public clearSession() {
    localStorage.removeItem(this.sessionStorageKey());
    delete this.api.defaults.headers.common.Authorization;
    delete this.api.defaults.headers.common.signer;

    this.session = null;
    this.token = null;

    this.notifySessionListeners();

    return this;
  }

  /**
   * Clear the active signing session.
   */
  public clearSignerSession() {
    localStorage.removeItem(this.sessionStorageKey());
    delete this.api.defaults.headers.common.Authorization;

    this.session = null;
    this.token = null;

    this.notifySessionListeners();

    return this;
  }

  private notifySessionListeners() {
    this.sessionListeners.forEach((listener: TSessionChangedListener) => {
      try {
        listener(this, this.session);
      } catch (e) {
        // NOOP
      }
    });
  }

  /**
   * Subscribe to session state change events.
   */
  public onSessionChanged(listener: TSessionChangedListener) {
    // There's no value in randomizing this, a simple counter is fine
    this.nextListenerId++;
    const listenerSymbol = Symbol.for('' + this.nextListenerId);
    this.sessionListeners.set(listenerSymbol, listener);

    return () => {
      this.sessionListeners.delete(listenerSymbol);
    };
  }

  /**
   * Load a persisted session from localStorage. Typically called once after the endpoint is configured when the app
   * or component starts.
   */
  public loadSession() {
    const token = localStorage.getItem(this.sessionStorageKey());
    if (!token) {
      return this.clearSession();
    }

    return this.setToken(token);
  }
}
