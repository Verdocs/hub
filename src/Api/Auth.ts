import {Endpoint} from './Endpoint';

export interface AuthenticateUserRequest {
  username: string;
  password: string;
}

export interface AuthenticateAppRequest {
  client_id: string;
  client_secret: string;
}

export interface AuthenticateResponse {
  idToken: string;
  accessToken: string;
  refreshToken: string;
}

/**
 * Authenticate to Verdocs via user/password authentication
 *
 * ```typescript
 * import {Auth, Endpoint} from '@verdocs/js-sdk';
 *
 * const {accessToken} = await Auth.authenticateUser({ username: 'test@test.com', password: 'PASSWORD' });
 * Endpoint.setAuthToken(accessToken);
 * ```
 */
export const authenticateUser = (params: AuthenticateUserRequest) =>
  Endpoint.post<AuthenticateResponse>('/authentication/login', params).then((r) => r.data);

/**
 * Authenticate to Verdocs via client ID / Secret authentication. **NOTE: This is only suitable for
 * NodeJS server-side applications. Never expose your Client Secret in a Web or Mobile app!** Also note
 * that access tokens may be cached by server-side apps (and this is recommended) but do expire after 2
 * hours. This expiration may change based on future security needs. Application developers are encouraged
 * to check the `exp` expiration field in the response accessToken and renew tokens after they expire.
 *
 * ```typescript
 * import {Auth, Endpoint} from '@verdocs/js-sdk';
 *
 * const {accessToken} = await Auth.authenticateApp({ client_id: 'CLIENTID', client_secret: 'SECRET' });
 * Endpoint.setAuthToken(accessToken);
 * ```
 */
export const authenticateApp = (params: AuthenticateAppRequest) =>
  Endpoint.post<AuthenticateResponse>('/authentication/login_client', {}, {headers: params}).then((r) => r.data);

export interface TokenValidationRequest {
  token: string;
}

export interface TokenValidationResponse {
  /** True if the token is valid */
  valid: boolean;
  /** The decoded and validated body of the JWT */
  payload: any;
}

/**
 * Validate a token. Only Verdocs tokens will be accepted. Most applications can decode tokens locally,
 * because tokens will be validated when API calls are made anyway. However, high-security applications
 * may use this endpoint to check if a token has been revoked.
 *
 * ```typescript
 * import {Auth} from '@verdocs/js-sdk';
 *
 * const {valid} = await Auth.validateToken({ token });
 * if (!valid) {
 *   window.alert('Session invalid or expired. Please re-authenticate.');
 * }
 * ```
 */
export const validateToken = (params: TokenValidationRequest) =>
  Endpoint.post<TokenValidationResponse>('/token/isValid', params).then((r) => r.data);

/**
 * If called before the session expires, this will refresh the caller's session and tokens.
 *
 * ```typescript
 * import {Auth} from '@verdocs/js-sdk';
 *
 * const profiles = await Auth.refreshTokens()
 * ```
 */
export const refreshTokens = () => Endpoint.get<AuthenticateResponse>('/token').then((r) => r.data);
