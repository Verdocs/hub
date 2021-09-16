import {Endpoint} from '../HTTP/Transport';
import {
  IAuthenticateAppRequest,
  IAuthenticateResponse,
  IAuthenticateUserRequest,
  TokenValidationRequest,
  TokenValidationResponse,
  UpdateEmailRequest,
  UpdateEmailResponse,
  UpdatePasswordRequest,
  UpdatePasswordResponse,
} from './Types';

/**
 * Authenticate to Verdocs via user/password authentication
 *
 * ```typescript
 * import {Auth} from '@verdocs/js-sdk/Auth';
 * import {Endpoint} from '@verdocs/js-sdk/HTTP';
 *
 * const {accessToken} = await Auth.authenticateUser({ username: 'test@test.com', password: 'PASSWORD' });
 * Endpoint.setAuthToken(accessToken);
 * ```
 */
export const authenticateUser = (params: IAuthenticateUserRequest) =>
  Endpoint.post<IAuthenticateResponse>('/authentication/login', params).then((r) => r.data);

/**
 * Authenticate to Verdocs via client ID / Secret authentication. **NOTE: This is only suitable for
 * NodeJS server-side applications. Never expose your Client Secret in a Web or Mobile app!** Also note
 * that access tokens may be cached by server-side apps (and this is recommended) but do expire after 2
 * hours. This expiration may change based on future security needs. Application developers are encouraged
 * to check the `exp` expiration field in the response accessToken and renew tokens after they expire.
 *
 * ```typescript
 * import {Auth} from '@verdocs/js-sdk/Auth';
 * import {Endpoint} from '@verdocs/js-sdk/HTTP';
 *
 * const {accessToken} = await Auth.authenticateApp({ client_id: 'CLIENTID', client_secret: 'SECRET' });
 * Endpoint.setAuthToken(accessToken);
 * ```
 */
export const authenticateApp = (params: IAuthenticateAppRequest): Promise<IAuthenticateResponse> =>
  Endpoint.post('/authentication/login_client', {}, {headers: params}).then((r) => r.data);

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
  Endpoint.post('/token/isValid', params).then((r) => r.data);

/**
 * If called before the session expires, this will refresh the caller's session and tokens.
 *
 * ```typescript
 * import {Auth} from '@verdocs/js-sdk/Auth';
 * import {Endpoint} from '@verdocs/js-sdk/HTTP';
 *
 * const {accessToken} = await Auth.refreshTokens();
 * Auth.Endpoint.setAuthToken(accessToken);
 * ```
 */
export const refreshTokens = (): Promise<IAuthenticateResponse> => Endpoint.get('/token').then((r) => r.data);

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
  Endpoint.put('/user/update_password', params).then((r) => r.data);

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
  Endpoint.put('/user/update_email', params).then((r) => r.data);
