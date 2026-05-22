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

export interface IAuthorizationCodeRequest {
  grant_type: 'authorization_code';
  code: string;
  client_id: string;
  client_secret: string;
  redirect_uri: string;
}

export type TAuthenticationRequest = IROPCRequest | IClientCredentialsRequest | IRefreshTokenRequest | IAuthorizationCodeRequest;

export interface IOAuth2AuthorizeParams {
  client_id: string;
  redirect_uri: string;
  response_type: 'code';
  state?: string;
  scope?: string;
}

/**
 * Authenticate to Verdocs.
 *
 * ```typescript
 * import {authenticate, VerdocsEndpoint} from '@verdocs/js-sdk';
 *
 * // Client-side call, suitable for Web and mobile apps:
 * const {access_token} = await authenticate(VerdocsEndpoint.getDefault(), { username: 'test@test.com', password: 'PASSWORD', grant_type:'password' });
 * VerdocsEndpoint.getDefault().setAuthToken(access_token);
 *
 * // Server-side call, suitable for server apps. NEVER EXPOSE client_secret IN FRONT-END CODE:
 * const {access_token} = await authenticate(VerdocsEndpoint.getDefault(), { client_id: '...', client_secret: '...', grant_type:'client_credentials' });
 * VerdocsEndpoint.getDefault().setAuthToken(access_token);
 *
 * // OAuth2 authorization code exchange (used by third-party integrations like PowerAutomate):
 * const {access_token} = await authenticate(VerdocsEndpoint.getDefault(), { grant_type: 'authorization_code', code: '...', client_id: '...', client_secret: '...', redirect_uri: '...' });
 * ```
 *
 * @group Authentication
 * @api POST /v2/oauth2/token Authenticate
 * @apiBody string(enum: 'client_credentials'|'refresh_token'|'password'|'authorization_code') grant_type The type of grant to request. API callers should nearly always use 'client_credentials'. Third-party OAuth2 integrations use 'authorization_code'.
 * @apiBody string(format: 'uuid') client_id? If grant_type is client_credentials, refresh_token, or authorization_code, the client ID to use.
 * @apiBody string(format: 'uuid') client_secret? If grant_type is client_credentials or authorization_code, the secret key to use.
 * @apiBody string username? If grant_type is password, the username to authenticate with.
 * @apiBody string password? If grant_type is password, the password to authenticate with.
 * @apiBody string code? If grant_type is authorization_code, the authorization code received from the authorize endpoint.
 * @apiBody string(format: 'uri') redirect_uri? If grant_type is authorization_code, must match the redirect_uri used in the authorize request.
 * @apiBody string scope? Optional scope to limit the auth token to. Do not specify this unless you are instructed to by a Verdocs Support rep.
 * @apiSuccess IAuthenticateResponse . Authentication tokens and expiration details
 */
export const authenticate = (endpoint: VerdocsEndpoint, params: TAuthenticationRequest) =>
  endpoint.api //
    .post<IAuthenticateResponse>('/v2/oauth2/token', params)
    .then((r) => r.data);

/**
 * Build the URL that starts an OAuth2 authorization code flow. Redirect the user's browser to this URL
 * to begin the flow. After the user authenticates and authorizes, they will be redirected to
 * `redirect_uri` with a `code` query parameter that can be exchanged for tokens via `authenticate()`
 * with `grant_type: 'authorization_code'`.
 *
 * ```typescript
 * import {getOAuth2AuthorizeUrl} from '@verdocs/js-sdk';
 *
 * const url = getOAuth2AuthorizeUrl(VerdocsEndpoint.getDefault(), {
 *   client_id: 'your-client-id',
 *   redirect_uri: 'https://your-app.com/callback',
 *   response_type: 'code',
 *   state: 'random-csrf-token',
 * });
 * window.location.href = url;
 * ```
 *
 * @group Authentication
 * @api GET /v2/oauth2/authorize Initiate an OAuth2 authorization code flow
 * @apiQuery string(format: 'uuid') client_id The client ID of the registered OAuth2 application.
 * @apiQuery string(format: 'uri') redirect_uri The URI to redirect to after authorization. Must match a registered redirect URI for the application.
 * @apiQuery string(enum: 'code') response_type Must be 'code' for authorization code flow.
 * @apiQuery string state? An opaque value used to prevent CSRF attacks. Returned unchanged in the redirect.
 * @apiQuery string scope? Optional scope to request.
 */
export const getOAuth2AuthorizeUrl = (endpoint: VerdocsEndpoint, params: IOAuth2AuthorizeParams): string => {
  const baseUrl = endpoint.getBaseURL?.() || 'https://api.verdocs.com';
  const url = new URL('/v2/oauth2/authorize', baseUrl);
  url.searchParams.set('client_id', params.client_id);
  url.searchParams.set('redirect_uri', params.redirect_uri);
  url.searchParams.set('response_type', params.response_type);
  if (params.state) url.searchParams.set('state', params.state);
  if (params.scope) url.searchParams.set('scope', params.scope);
  return url.toString();
};

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
