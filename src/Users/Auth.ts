import {IAuthenticateResponse, IChangePasswordRequest, IChangePasswordResponse, IVerifyEmailRequest} from './Types';
import {VerdocsEndpoint} from '../VerdocsEndpoint';
import {IUser} from '../Models';

export interface IROPCRequest {
  grant_type: 'password';
  username: string;
  password: string;
  client_id?: string;
  scope?: string;
}

export interface IClientCredentialsRequest {
  grant_type: 'client_credentials';
  client_id: string;
  client_secret: string;
  scope?: string;
}

export interface IRefreshTokenRequest {
  grant_type: 'refresh_token';
  refresh_token: string;
  client_id?: string;
  scope?: string;
}

export type TAuthenticationRequest = IROPCRequest | IClientCredentialsRequest | IRefreshTokenRequest;

/**
 * Authenticate to Verdocs.
 *
 * ```typescript
 * import {authenticate, VerdocsEndpoint} from '@verdocs/js-sdk';
 *
 * // Client-side call, suitable for Web and mobile apps:
 * const {access_token} = await Auth.authenticate({ username: 'test@test.com', password: 'PASSWORD', grant_type:'password' });
 * VerdocsEndpoint.getDefault().setAuthToken(access_token);
 *
 * // Server-side call, suitable for server apps. NEVER EXPOSE client_secret IN FRONT-END CODE:
 * const {access_token} = await Auth.authenticate({ client_id: '...', client_secret: '...', grant_type:'client_credentials' });
 * VerdocsEndpoint.getDefault().setAuthToken(access_token);
 * ```
 *
 * @group Authentication
 * @api POST /v2/oauth2/token Authenticate
 * @apiBody string(enum: 'client_credentials'|'refresh_token'|'password') grant_type The type of grant to request. API callers should nearly always use 'client_credentials'.
 * @apiBody string(format: 'uuid') client_id? If grant_type is client_credentials or refresh_token, the client ID of the API key to use.
 * @apiBody string(format: 'uuid') client_secret? If grant_type is client_credentials, the secret key of the API key to use.
 * @apiBody string username? If grant_type is password, the username to authenticate with.
 * @apiBody string password? If grant_type is password, the password to authenticate with.
 * @apiBody string password? If grant_type is password, the password to authenticate with.
 * @apiBody string scope? Optional scope to limit the auth token to. Do not specify this unless you are instructed to by a Verdocs Support rep.
 * @apiSuccess IAuthenticateResponse . The detailed metadata for the envelope requested
 */
export const authenticate = (endpoint: VerdocsEndpoint, params: TAuthenticationRequest) =>
  endpoint.api //
    .post<IAuthenticateResponse>('/v2/oauth2/token', params)
    .then((r) => r.data);

/**
 * If called before the session expires, this will refresh the caller's session and tokens.
 *
 * ```typescript
 * import {Auth, VerdocsEndpoint} from '@verdocs/js-sdk';
 *
 * const {accessToken} = await Auth.refreshTokens();
 * VerdocsEndpoint.setAuthToken(accessToken);
 * ```
 */
export const refreshToken = (endpoint: VerdocsEndpoint, refreshToken: string) =>
  authenticate(endpoint, {grant_type: 'refresh_token', refresh_token: refreshToken});

/**
 * Update the caller's password when the old password is known (typically for logged-in users).
 *
 * ```typescript
 * import {changePassword} from '@verdocs/js-sdk';
 *
 * const {status, message} = await changePassword({ old_password, new_password });
 * if (status !== 'OK') {
 *   window.alert(`Password reset error: ${message}`);
 * }
 * ```
 *
 * @group Authentication
 * @api POST /v2/users/change-password Change the caller's password
 * @apiBody string old_password Current password for the caller
 * @apiBody string new_password New password to set for the caller. Must meet strength requirements.
 * @apiSuccess string . Success
 */
export const changePassword = (endpoint: VerdocsEndpoint, params: IChangePasswordRequest) =>
  endpoint.api //
    .post<IChangePasswordResponse>('/v2/users/change-password', params)
    .then((r) => r.data);

/**
 * Request a password reset, when the old password is not known (typically in login forms).
 *
 * ```typescript
 * import {resetPassword} from '@verdocs/js-sdk';
 *
 * const {success} = await resetPassword({ email });
 * if (status !== 'OK') {
 *   window.alert(`Please check your email for instructions on how to reset your password.`);
 * }
 *
 * // Collect code and new password from the user, then call:
 *
 * const {success} = await resetPassword({ email, code, new_password });
 * if (status !== 'OK') {
 *   window.alert(`Please check your verification code and try again.`);
 * }
 * ```
 *
 * @group Authentication
 * @api POST /v2/users/reset-password Reset a password for a user
 * @apiBody string email Email address for the user account
 * @apiBody string code? To initiate a reset request, omit this field. To complete it, provide the emailed code received by the user.
 * @apiBody string new_password? To initiate a reset request, omit this field. To complete it, provide the new password the user wishes to use.
 * @apiSuccess string . Success
 */
export const resetPassword = (endpoint: VerdocsEndpoint, params: {email: string; code?: string; new_password?: string}) =>
  endpoint.api //
    .post<{success: boolean}>('/v2/users/reset-password', params)
    .then((r) => r.data);

/**
 * Resend the email verification request if the email or token are unknown. Instead, an accessToken
 * may be supplied through which the user will be identified. This is intended to be used in post-signup
 * cases where the user is "partially" authenticated (has a session, but is not yet verified).
 *
 * ```typescript
 * import {resendVerification} from '@verdocs/js-sdk';
 *
 * const result = await resendVerification();
 * ```
 *
 * @group Authentication
 * @api POST /v2/users/verify Resend an email verification request for a "partially" authenticated user (authenticated, but not yet verified)
 * @apiSuccess string . Success
 */
export const resendVerification = (endpoint: VerdocsEndpoint, accessToken?: string) =>
  endpoint.api //
    .post<{result: 'done'}>('/v2/users/resend-verification', {}, accessToken ? {headers: {Authorization: `Bearer ${accessToken}`}} : {})
    .then((r) => r.data);

/**
 * Resend the email verification request if the user is unauthenticated, but the email and token are known.
 * Used if the token is valid but has expired.
 *
 * ```typescript
 * import {resendVerification} from '@verdocs/js-sdk';
 *
 * const result = await resendVerification();
 * ```
 *
 * @group Authentication
 * @api POST /v2/users/verify Resend the email verification request if both the email and token are known. Used if the token is valid but has expired.
 * @apiSuccess IAuthenticateResponse . Updated authentication details
 */
export const verifyEmail = (endpoint: VerdocsEndpoint, params: IVerifyEmailRequest) =>
  endpoint.api //
    .post<IAuthenticateResponse>('/v2/users/verify', params)
    .then((r) => r.data);

/**
 * Get the caller's current user record.
 *
 * @group Authentication
 * @api GET /v2/users/me Get the caller's user record.
 * @apiSuccess IUser . User record
 */
export const getMyUser = (endpoint: VerdocsEndpoint) =>
  endpoint.api //
    .get<IUser>('/v2/users/me')
    .then((r) => r.data);
