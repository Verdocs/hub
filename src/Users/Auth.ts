import type {IAuthenticateResponse, UpdatePasswordResponse, IAuthenticateAppRequest, IAuthenticateUserRequest} from './Types';
import {VerdocsEndpoint} from '../VerdocsEndpoint';
import {IUpdatePasswordRequest} from './Types';

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
 * to check the `exp` expiration field in the response, and renew tokens after they expire.
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
 * Update the caller's password when the old password is known (typically for logged-in users).
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
export const changePassword = (endpoint: VerdocsEndpoint, params: IUpdatePasswordRequest): Promise<UpdatePasswordResponse> =>
  endpoint.api //
    .put('/user/update_password', params)
    .then((r) => r.data);

/**
 * Request a password reset, when the old password is not known (typically in login forms).
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
 * Resend the email verification request. Note that to prevent certain forms of abuse, the email address is not
 * a parameter here. Instead, the caller must be authenticated as the (unverified) user. To simplify this process,
 * the access token to be used may be passed directly as a parameter here. This avoids the need to set it as the
 * active token on an endpoint, which may be inconvenient in workflows where it is preferable to keep the user in
 * "anonymous" mode while verification is being performed.
 *
 * ```typescript
 * import {Auth} from '@verdocs/js-sdk/Auth';
 *
 * const result = await Auth.resendVerification();
 * ```
 */
export const resendVerification = (endpoint: VerdocsEndpoint, accessToken?: string): Promise<{result: 'done'}> =>
  endpoint.api //
    .post('/user/email_verification', {}, accessToken ? {headers: {Authorization: `Bearer ${accessToken}`}} : {})
    .then((r) => r.data);
