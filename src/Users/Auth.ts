import type {IAuthenticateResponse, IUpdatePasswordRequest, IUpdatePasswordResponse} from './Types';
import {VerdocsEndpoint} from '../VerdocsEndpoint';

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
 */
export const changePassword = (endpoint: VerdocsEndpoint, params: IUpdatePasswordRequest) =>
  endpoint.api //
    .post<IUpdatePasswordResponse>('/v2/users/change-password', params)
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
 * ```
 */
export const resetPassword = (endpoint: VerdocsEndpoint, params: {email: string}) =>
  endpoint.api //
    .post<{success: boolean}>('/v2/users/reset-password', params)
    .then((r) => r.data);

/**
 * Check whether email verification has been completed. Once it has, a new session will be generated.
 *
 * ```typescript
 * import {checkVerification} from '@verdocs/js-sdk';
 *
 * const result = await checkVerification();
 * ```
 */
export const checkVerification = (endpoint: VerdocsEndpoint, email: string, code: string) =>
  endpoint.api //
    .post<{status: 'PENDING'} | IAuthenticateResponse>('/v2/users/check-verification', {email, code})
    .then((r) => r.data);

/**
 * Resend the email verification request. Note that to prevent certain forms of abuse, the email address is not
 * a parameter here. Instead, the caller must be authenticated as the (unverified) user. To simplify this process,
 * the access token to be used may be passed directly as a parameter here. This avoids the need to set it as the
 * active token on an endpoint, which may be inconvenient in workflows where it is preferable to keep the user in
 * "anonymous" mode while verification is being performed.
 *
 * ```typescript
 * import {resendVerification} from '@verdocs/js-sdk';
 *
 * const result = await resendVerification();
 * ```
 */
export const resendVerification = (endpoint: VerdocsEndpoint, accessToken?: string) =>
  endpoint.api //
    .post<{result: 'done'}>('/v2/users/resend-verification', {}, accessToken ? {headers: {Authorization: `Bearer ${accessToken}`}} : {})
    .then((r) => r.data);
