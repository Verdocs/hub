import {IAuthenticateAppRequest, IAuthenticateUserRequest} from './Types';
import {TokenValidationRequest, UpdateEmailRequest, IUpdatePasswordRequest} from './Types';
import {IAuthenticateResponse, TokenValidationResponse, UpdateEmailResponse, UpdatePasswordResponse} from './Types';
import {VerdocsEndpoint} from '../VerdocsEndpoint';

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
export const authenticateUser = (endpoint: VerdocsEndpoint, params: IAuthenticateUserRequest) =>
  endpoint.api //
    .post<IAuthenticateResponse>('/authentication/login', params)
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
export const authenticateApp = (endpoint: VerdocsEndpoint, params: IAuthenticateAppRequest): Promise<IAuthenticateResponse> =>
  endpoint.api //
    .post('/authentication/login_client', {}, {headers: params as any})
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
export const validateToken = (endpoint: VerdocsEndpoint, params: TokenValidationRequest): Promise<TokenValidationResponse> =>
  endpoint.api //
    .post('/token/isValid', params)
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
export const refreshTokens = (endpoint: VerdocsEndpoint): Promise<IAuthenticateResponse> =>
  endpoint.api //
    .get('/token')
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
export const updatePassword = (endpoint: VerdocsEndpoint, params: IUpdatePasswordRequest): Promise<UpdatePasswordResponse> =>
  endpoint.api //
    .put('/user/update_password', params)
    .then((r) => r.data);

/**
 * Reset the caller's password.
 *
 * ```typescript
 * import {Auth} from '@verdocs/js-sdk/Auth';
 *
 * const {success} = await Auth.resetPassword({ email });
 * if (status !== 'OK') {
 *   window.alert(`Please check your email for instructions on how to reset your password.`);
 * }
 * ```
 */
export const resetPassword = (endpoint: VerdocsEndpoint, params: {email: string}): Promise<{success: boolean}> =>
  endpoint.api //
    .post('/user/reset_password', params)
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
export const updateEmail = (endpoint: VerdocsEndpoint, params: UpdateEmailRequest): Promise<UpdateEmailResponse> =>
  endpoint.api //
    .put('/user/update_email', params)
    .then((r) => r.data);
