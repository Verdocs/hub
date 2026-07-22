import axios, { AxiosInstance } from 'axios';
import { decodeAccessTokenBody, randomString } from './Utils';
import { TSession, TSessionType } from './Sessions';
import globalThis from './Utils/globalThis';
import { getCurrentProfile } from './Users';
import { IProfile } from './Models';

// @credit https://derickbailey.com/2016/03/09/creating-a-true-singleton-in-node-js-with-es6-symbols/
// Also see globalThis for comments about why we're doing this in the first place.
const ENDPOINT_KEY = Symbol.for('verdocs-default-endpoint');

const BETA_ORIGINS = [
  //
  'https://beta.verdocs.com',
  'https://stage.verdocs.com',
  'http://localhost:6006',
  'http://localhost:5173',
];

const requestLogger = (r: any) => {
  // TODO: Re-activate logging via an isomorphic approach
  return r;
};

const isBrowser = typeof globalThis.window !== 'undefined';

export type TEnvironment = '' | 'beta';

export type TSessionChangedListener = (endpoint: VerdocsEndpoint, session: TSession, profile: IProfile | null) => void;

/**
 * Constructor options for VerdocsEndpoint
 * 
 */
export interface VerdocsEndpointOptions {
  /** Override the API base URL. Rarely needed outside Verdocs-directed setups. */
  baseURL?: string;
  /** Request timeout in milliseconds. Defaults to 60000. */
  timeout?: number;
  /** Target environment. Defaults to production unless running on a known beta origin. */
  environment?: TEnvironment;
  /** Session type this endpoint manages, either 'user' or 'signing'. Defaults to 'user'. */
  sessionType?: TSessionType;
  /** Client ID sent as the X-Client-ID header on each request. */
  clientID?: string;
  /** By default, sessions will be persisted to localStorage. Set `persist` to false to bypass this. */
  persist?: boolean;
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
 *     .setClientID('1234')
 *     .setTimeout(30000);
 * ```
 *
 * @sdkOperation endpoint.VerdocsEndpoint
 * @sdkGroup Endpoint
 * @sdkPage Helpers
 * @sdkGettingStarted
 */
export class VerdocsEndpoint {
  private environment: TEnvironment = BETA_ORIGINS.includes(globalThis.window?.location?.origin || '') ? 'beta' : '';
  private sessionType = 'user' as TSessionType;
  private persist = true;
  private baseURL = BETA_ORIGINS.includes(globalThis.window?.location?.origin || '')
    ? 'https://stage-api.verdocs.com'
    : 'https://api.verdocs.com';
  private clientID = 'not-set' as string;
  private timeout = 60000 as number;
  private token = null as string | null;
  private nextListenerId = 0;
  private sessionListeners = new Map<symbol, TSessionChangedListener>();
  private requestLoggerId: number | null = null;

  public endpointId = randomString(8);

  /**
   * The current user's userId (NOT profileId), or null if not authenticated.
   */
  public sub = null as string | null;

  /**
   * The current user session, or null if not authenticated. May be either a User or Signing session. If set, the
   * presence of the `document_id` field can be used to differentiate the types. Only signing sessions are associated
   * with Envelopes.
   */
  public session = null as TSession;

  /**
   * The current user's profile, if known. Note that while sessions are loaded and handled synchronously,
   * profiles are loaded asynchronously and may not be available immediately after a session is loaded.
   * To ensure both are available, developers should subscribe to the `onSessionChanged` event, which
   * will not be fired until the profile is loaded and verified.
   */
  public profile = null as IProfile | null;

  public api: AxiosInstance;

  /**
   * Create a new VerdocsEndpoint to call Verdocs platform services.
   *
   * ```typescript
   * import {VerdocsEndpoint} from '@verdocs/js-sdk/HTTP';
   * const endpoint = new VerdocsEndpoint();
   * ```
   *
   * @sdkOperation endpoint.constructor
   * @sdkGroup Endpoint
   * @sdkPage Helpers
   */
  constructor(options?: VerdocsEndpointOptions) {
    this.baseURL = options?.baseURL ?? this.baseURL;
    this.timeout = options?.timeout ?? this.timeout;
    this.environment = options?.environment ?? this.environment;
    this.sessionType = options?.sessionType ?? this.sessionType;
    this.clientID = options?.clientID ?? this.clientID;
    this.persist = options?.persist ?? this.persist;
    this.api = axios.create({ baseURL: this.baseURL, timeout: this.timeout });
  }

  /**
   * @sdkOperation endpoint.setDefault
   * @sdkGroup Endpoint
   * @sdkPage Helpers
   */
  public setDefault() {
    globalThis[ENDPOINT_KEY] = this;
  }

  /**
   * @sdkOperation endpoint.getDefault
   * @sdkGroup Endpoint
   * @sdkPage Helpers
   */
  public static getDefault(): VerdocsEndpoint {
    if (!globalThis[ENDPOINT_KEY]) {
      globalThis[ENDPOINT_KEY] = new VerdocsEndpoint();
    }

    return globalThis[ENDPOINT_KEY];
  }

  /**
   * Get the current environment.
   *
   * @sdkOperation endpoint.getEnvironment
   * @sdkGroup Endpoint
   * @sdkPage Helpers
   */
  public getEnvironment() {
    return this.environment;
  }

  /**
   * Get the current session type.
   *
   * @sdkOperation endpoint.getSessionType
   * @sdkGroup Endpoint
   * @sdkPage Helpers
   */
  public getSessionType() {
    return this.sessionType;
  }

  /**
   * Get the current base URL. This should rarely be anything other than 'https://api.verdocs.com'.
   *
   * @sdkOperation endpoint.getBaseURL
   * @sdkGroup Endpoint
   * @sdkPage Helpers
   */
  public getBaseURL() {
    return this.baseURL;
  }

  /**
   * Get the current client ID, if set.
   *
   * @sdkOperation endpoint.getClientID
   * @sdkGroup Endpoint
   * @sdkPage Helpers
   */
  public getClientID() {
    return this.clientID;
  }

  /**
   * Get the current timeout.
   *
   * @sdkOperation endpoint.getTimeout
   * @sdkGroup Endpoint
   * @sdkPage Helpers
   */
  public getTimeout() {
    return this.timeout;
  }

  /**
   * Get the current session, if any.
   *
   * @sdkOperation endpoint.getSession
   * @sdkGroup Endpoint
   * @sdkPage Helpers
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
   *
   * @sdkOperation endpoint.setEnvironment
   * @sdkGroup Endpoint
   * @sdkPage Helpers
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
   *
   * @sdkOperation endpoint.setSessionType
   * @sdkGroup Endpoint
   * @sdkPage Helpers
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
   *
   * @sdkOperation endpoint.setBaseURL
   * @sdkGroup Endpoint
   * @sdkPage Helpers
   */
  public setBaseURL(url: string): VerdocsEndpoint {
    this.baseURL = url;
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
   *
   * @sdkOperation endpoint.setClientID
   * @sdkGroup Endpoint
   * @sdkPage Helpers
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
   *
   * @sdkOperation endpoint.setTimeout
   * @sdkGroup Endpoint
   * @sdkPage Helpers
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
   *
   * @sdkOperation endpoint.logRequests
   * @sdkGroup Endpoint
   * @sdkPage Helpers
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
   *
   * @sdkOperation endpoint.setToken
   * @sdkGroup Endpoint
   * @sdkPage Helpers
   */
  public setToken(token: string | null, sessionType: TSessionType = 'user'): VerdocsEndpoint {
    if (!token) {
      return this.clearSession();
    }

    const session = decodeAccessTokenBody(token);
    if (session === null || (session.exp && session.exp * 1000 < new Date().getTime())) {
      return this.clearSession();
    }

    this.token = token;
    this.session = session;
    this.sub = session.sub;
    this.sessionType = sessionType;
    if (this.sessionType === 'user') {
      this.api.defaults.headers.common.Authorization = `Bearer ${token}`;
      if (this.persist && isBrowser) {
        globalThis.localStorage.setItem(this.sessionStorageKey(), token);
      }
    } else {
      // Required for legacy calls to rForm
      this.api.defaults.headers.common.signer = `Bearer ${token}`;
      // TODO: Once we confirm rForm doesn't react badly to this, we can switch over
      // this.api.defaults.headers.common.Authorization = `Bearer ${token}`;
    }

    if (this.sessionType === 'user') {
      getCurrentProfile(this)
        .then((r) => {
          this.profile = r || null;
          this.notifySessionListeners();
        })
        .catch(() => {
          this.profile = null;
          this.sub = null;

          // We can't clear the token verdocs-auth may be using temporarily during registration
          if (this.persist) {
            this.clearSession();
          }
        });
    } else {
      this.notifySessionListeners();
    }

    return this;
  }

  /**
   * Retrieves the current session token, if any. Tokens should rarely be used for direct actions, but this is
   * required by the `<VerdocsView>` and other components to authorize requests to raw PDF files.
   *
   * @sdkOperation endpoint.getToken
   * @sdkGroup Endpoint
   * @sdkPage Helpers
   */
  public getToken() {
    return this.token;
  }

  private sessionStorageKey() {
    return `verdocs-session-${this.getSessionType()}-${this.getEnvironment()}`;
  }

  /**
   * Clear the active session.
   *
   * @sdkOperation endpoint.clearSession
   * @sdkGroup Endpoint
   * @sdkPage Helpers
   */
  public clearSession() {
    if (this.persist) {
      localStorage.removeItem(this.sessionStorageKey());
    }

    delete this.api.defaults.headers.common.Authorization;
    delete this.api.defaults.headers.common.signer;

    this.session = null;
    this.profile = null;
    this.token = null;
    this.sub = null;

    this.notifySessionListeners();

    return this;
  }

  /**
   * Clear the active signing session.
   *
   * @sdkOperation endpoint.clearSignerSession
   * @sdkGroup Endpoint
   * @sdkPage Helpers
   */
  public clearSignerSession() {
    if (this.persist) {
      localStorage.removeItem(this.sessionStorageKey());
    }

    delete this.api.defaults.headers.common.Authorization;

    this.session = null;
    this.profile = null;
    this.token = null;
    this.sub = null;

    this.notifySessionListeners();

    return this;
  }

  private notifySessionListeners() {
    this.sessionListeners.forEach((listener: TSessionChangedListener) => {
      try {
        listener(this, this.session, this.profile);
      } catch {
        // NOOP
      }
    });
  }

  /**
   * Subscribe to session state change events.
   *
   * @sdkOperation endpoint.onSessionChanged
   * @sdkGroup Endpoint
   * @sdkPage Helpers
   */
  public onSessionChanged(listener: TSessionChangedListener) {
    // There's no value in randomizing this, a simple counter is fine
    this.nextListenerId++;
    const listenerSymbol = Symbol.for('' + this.nextListenerId);
    this.sessionListeners.set(listenerSymbol, listener);

    // Perform an immediate notification if this listener subscribed after the session was already loaded.
    if (this.profile) {
      listener(this, this.session, this.profile);
    }

    return () => {
      this.sessionListeners.delete(listenerSymbol);
    };
  }

  /**
   * Load a persisted session from localStorage. Typically called once after the endpoint is configured
   * when the app or component starts. Ignored if the endpoint is configured to not persist sessions.
   *
   * @sdkOperation endpoint.loadSession
   * @sdkGroup Endpoint
   * @sdkPage Helpers
   */
  public loadSession() {
    if (!this.persist) {
      return this;
    }

    const token = localStorage.getItem(this.sessionStorageKey());
    if (!token) {
      return this.clearSession();
    }

    // We sometimes get multiple loadSession calls from stacked components all needing to just ensure
    // we've done our best to load it. We only set it the first time to avoid dupe profile reloads
    // and upstream component notifications.
    return this.token ? this : this.setToken(token);
  }
}
