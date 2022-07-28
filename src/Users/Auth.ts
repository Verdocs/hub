import {
  IActiveSession,
  IAuthenticateAppRequest,
  IAuthenticateUserRequest,
  TokenValidationRequest,
  UpdateEmailRequest,
} from './Types';
import {IAuthenticateResponse, TokenValidationResponse, UpdateEmailResponse, UpdatePasswordResponse} from './Types';
import {UpdatePasswordRequest} from './Types';
import {getEndpoint} from '../HTTP/Transport';
import {ISigningSession} from '../Documents/Types';
import {decodeAccessTokenBody} from '../Utils/Token';

/**
 * Authenticate to Verdocs via user/password authentication
 *
 * ```typescript
 * import {Auth} from '@verdocs/js-sdk/Auth';
 * import {Transport} from '@verdocs/js-sdk/HTTP';
 *
 * const {accessToken} = await Auth.authenticateUser({ username: 'test@test.com', password: 'PASSWORD' });
 * Transport.setAuthToken(accessToken);
 * ```
 */
export const authenticateUser = (params: IAuthenticateUserRequest) =>
  getEndpoint()
    .api.post<IAuthenticateResponse>('/authentication/login', params)
    .then((r) => r.data);

/**
 * Authenticate to Verdocs via client ID / Secret authentication. **NOTE: This is only suitable for
 * NodeJS server-side applications. Never expose your Client Secret in a Web or Mobile app!** Also note
 * that access tokens may be cached by server-side apps (and this is recommended) but do expire after 2
 * hours. This expiration may change based on future security needs. Application developers are encouraged
 * to check the `exp` expiration field in the response accessToken and renew tokens after they expire.
 *
 * ```typescript
 * import {Auth} from '@verdocs/js-sdk/Auth';
 * import {Transport} from '@verdocs/js-sdk/HTTP';
 *
 * const {accessToken} = await Auth.authenticateApp({ client_id: 'CLIENTID', client_secret: 'SECRET' });
 * Transport.setAuthToken(accessToken);
 * ```
 */
export const authenticateApp = (params: IAuthenticateAppRequest): Promise<IAuthenticateResponse> =>
  getEndpoint()
    .api.post('/authentication/login_client', {}, {headers: params as any})
    .then((r) => r.data);

/**
 * Validate a token. Only Verdocs tokens will be accepted. Most applications can decode tokens locally,
 * because tokens will be validated when API calls are made anyway. However, high-security applications
 * may use this endpoint to check if a token has been revoked.
 *
 * ```typescript
 * import {Auth} from '@verdocs/js-sdk/Auth';
 *
 * const {valid} = await Auth.validateToken({ token });
 * if (!valid) {
 *   window.alert('Session invalid or expired. Please re-authenticate.');
 * }
 * ```
 */
export const validateToken = (params: TokenValidationRequest): Promise<TokenValidationResponse> =>
  getEndpoint()
    .api.post('/token/isValid', params)
    .then((r) => r.data);

/**
 * If called before the session expires, this will refresh the caller's session and tokens.
 *
 * ```typescript
 * import {Auth} from '@verdocs/js-sdk/Auth';
 * import {Transport} from '@verdocs/js-sdk/HTTP';
 *
 * const {accessToken} = await Auth.refreshTokens();
 * Transport.setAuthToken(accessToken);
 * ```
 */
export const refreshTokens = (): Promise<IAuthenticateResponse> =>
  getEndpoint()
    .api.get('/token')
    .then((r) => r.data);

/**
 * Update the caller's password. To help prevent CSRF attack vectors, the user's old password and email address are required.
 *
 * ```typescript
 * import {Auth} from '@verdocs/js-sdk/Auth';
 *
 * const {status, message} = await Auth.updatePassword({ email, oldPassword, newPassword });
 * if (status !== 'OK') {
 *   window.alert(`Password reset error: ${message}`);
 * }
 * ```
 */
export const updatePassword = (params: UpdatePasswordRequest): Promise<UpdatePasswordResponse> =>
  getEndpoint()
    .api.put('/user/update_password', params)
    .then((r) => r.data);

/**
 * Update the caller's email address.
 *
 * ```typescript
 * import {Auth} from '@verdocs/js-sdk/Auth';
 *
 * const {profiles} = await Auth.updateEmail({ email: newEmail });
 * ```
 */
export const updateEmail = (params: UpdateEmailRequest): Promise<UpdateEmailResponse> =>
  getEndpoint()
    .api.put('/user/update_email', params)
    .then((r) => r.data);

export type TSession = IActiveSession | ISigningSession | null;

const clearSession = (source: string, persist: boolean) => {
  getEndpoint().setAuthorization(null);

  if (persist) {
    localStorage.removeItem(source);
  }

  notifySessionListeners(source, null);
  return null;
};

/**
 * Parses and sets the active session, optionally persisting (brower-only, persists to localStorage).
 */
export const setSession = (source: string, token: string | null, persist: boolean = false): TSession => {
  if (token === null) {
    return clearSession(source, persist);
  }

  const session = decodeAccessTokenBody(token || '') as TSession;
  if (session === null || (session.exp && session.exp * 1000 < new Date().getTime())) {
    return clearSession(source, persist);
  }

  if (persist) {
    localStorage.setItem(source, token);
  }

  getEndpoint().setAuthorization(token);

  notifySessionListeners(source, session);
  return session;
};

/**
 * Load a session from localStorage
 */
export const loadSession = (source: string): IActiveSession | ISigningSession | null => {
  const token = localStorage.getItem(source);
  if (!token) {
    return null;
  }

  const session = decodeAccessTokenBody(token) as IActiveSession | ISigningSession | null;
  if (!session) {
    return null;
  }

  if (session.exp && session.exp * 1000 < new Date().getTime()) {
    localStorage.removeItem(source);
    return null;
  }

  getEndpoint().setAuthorization(token);

  notifySessionListeners(source, session);
  return session;
};

/**
 * End the active session.
 */
export const endSession = (source: string, persist: boolean = false) => clearSession(source, persist);

export type SessionChangedListener = (source: string, session: IActiveSession | ISigningSession | null) => void;

const sessionChangedListeners = new Map<symbol, SessionChangedListener>();
let nextListenerId = 1;

/**
 * Subscribe to session state change events.
 */
export const onSessionChanged = (listener: SessionChangedListener) => {
  // There's no value in randomizing this so we don't
  const listenerId = ++nextListenerId;
  const listenerSymbol = Symbol.for('' + listenerId);

  sessionChangedListeners.set(listenerSymbol, listener);

  return () => {
    sessionChangedListeners.delete(listenerSymbol);
  };
};

const notifySessionListeners = (source: string, session: IActiveSession | ISigningSession | null) => {
  sessionChangedListeners.forEach((listener) => {
    try {
      listener(source, session);
    } catch (e) {
      // NOOP
    }
  });
};
