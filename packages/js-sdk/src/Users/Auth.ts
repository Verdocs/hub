import {IAuthenticateResponse, IChangePasswordRequest, IChangePasswordResponse, ISocialProviders, IVerifyEmailRequest} from './Types';
import {VerdocsEndpoint} from '../VerdocsEndpoint';
import {TSocialLoginProvider} from './Types';
import {IUser} from '../Models';

/** @deprecated. Use IAuthorizationCodeRequest instead. */ 
export interface IROPCRequest {
  grant_type: 'password';
  username: string;
  password: string;
  client_id?: string;
  scope?: string;
}

/** NOTE: This should _only_ be used for _server-to-server_ requests. */
export interface IClientCredentialsRequest {
  grant_type: 'client_credentials';
  client_id: string;
  client_secret: string;
  scope?: string;
}

/** Refresh any existing session. */
export interface IRefreshTokenRequest {
  grant_type: 'refresh_token';
  refresh_token: string;
  client_id?: string;
  scope?: string;
}

/** Standard PKCE flow. */
export interface IAuthorizationCodeRequest {
  grant_type: 'authorization_code';
  code: string;
  client_id: string;
  client_secret: string;
  redirect_uri: string;
}

/** Complete a sign-in that had an MFA challenge issued, using a TOTP code. */
export interface IMFAOtpGrantRequest {
  grant_type: 'urn:verdocs:params:oauth:grant-type:mfa-otp';
  mfa_token: string;
  /** Although typed as a string, OTP codes should always be [0-9]{6}. */
  otp: string;
}

/** 
 * Complete a sign-in that had an MFA challenge issued, using a backup code. Note that backup codes are one-time-use.
 * Developers providing Web or mobile UIs that allow users to enter backup MFA codes should include dialogs/workflows
 * that encourage users to generate new backup codes to prevent them from being fully depleted.
 */
export interface IMFARecoveryCodeGrantRequest {
  grant_type: 'urn:verdocs:params:oauth:grant-type:mfa-recovery-code';
  mfa_token: string;
  /** Backup codes should be formatted [0-9a-zA-Z]{4}-[0-9a-zA-Z]{4}. */
  recovery_code: string;
}

/** Second half of a PKCE flow specifically from a social IdP. */
export interface ILoginCodeGrantRequest {
  grant_type: 'urn:verdocs:params:oauth:grant-type:login-code';
  login_code: string;
  code_verifier: string;
}

export type TAuthenticationRequest =
  | IROPCRequest
  | IClientCredentialsRequest
  | IRefreshTokenRequest
  | IAuthorizationCodeRequest
  | IMFAOtpGrantRequest
  | IMFARecoveryCodeGrantRequest
  | ILoginCodeGrantRequest;

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
 * @apiBody string(enum: 'client_credentials'|'refresh_token'|'password'|'authorization_code'|'urn:verdocs:params:oauth:grant-type:mfa-otp'|'urn:verdocs:params:oauth:grant-type:mfa-recovery-code'|'urn:verdocs:params:oauth:grant-type:login-code') grant_type The type of grant to request. API callers should nearly always use 'client_credentials'. Third-party OAuth2 integrations use 'authorization_code'. The mfa-otp and mfa-recovery-code grants complete a sign-in that was answered with an 'mfa_required' challenge, and the login-code grant completes a Google or Microsoft sign-in.
 * @apiBody string(format: 'uuid') client_id? If grant_type is client_credentials, refresh_token, or authorization_code, the client ID to use.
 * @apiBody string(format: 'uuid') client_secret? If grant_type is client_credentials or authorization_code, the secret key to use.
 * @apiBody string username? If grant_type is password, the username to authenticate with.
 * @apiBody string password? If grant_type is password, the password to authenticate with.
 * @apiBody string code? If grant_type is authorization_code, the authorization code received from the authorize endpoint.
 * @apiBody string(format: 'uri') redirect_uri? If grant_type is authorization_code, must match the redirect_uri used in the authorize request.
 * @apiBody string mfa_token? If grant_type is an MFA type, the token returned from the challenge.
 * @apiBody string otp? If grant_type is an MFA-with-OTP type, the six-digit code from the user's authenticator.
 * @apiBody string recovery_code? If grant_type is an MFA-with-recovery-code type, the backup code.
 * @apiBody string login_code? If grant_type is a PKCE type, the login code from the IdP.
 * @apiBody string code_verifier? If grant_type is is a PKCE type, the PKCE verifier from the challenge.
 * @apiBody string scope? Optional scope to limit the auth token to. Do not specify this unless you are instructed to by a Verdocs Support rep.
 * @apiSuccess IAuthenticateResponse . Authentication tokens and expiration details
 *
 * @sdkOperation auth.authenticate
 * @sdkGroup Auth
 * @sdkPage Endpoints
 * @sdkGettingStarted
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
 *
 * @sdkOperation auth.getOAuth2AuthorizeUrl
 * @sdkGroup Auth
 * @sdkPage Endpoints
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
 *
 * @sdkOperation auth.refreshToken
 * @sdkGroup Auth
 * @sdkPage Endpoints
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
 *
 * @sdkOperation auth.changePassword
 * @sdkGroup Auth
 * @sdkPage Endpoints
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
 *
 * @sdkOperation auth.resetPassword
 * @sdkGroup Auth
 * @sdkPage Endpoints
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
 * @api POST /v2/users/resend-verification Resend an email verification request for a "partially" authenticated user (authenticated, but not yet verified)
 * @apiSuccess string . Success
 *
 * @sdkOperation auth.resendVerification
 * @sdkGroup Auth
 * @sdkPage Endpoints
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
 *
 * @sdkOperation auth.verifyEmail
 * @sdkGroup Auth
 * @sdkPage Endpoints
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
 *
 * @sdkOperation auth.getMyUser
 * @sdkGroup Auth
 * @sdkPage Endpoints
 */
export const getMyUser = (endpoint: VerdocsEndpoint) =>
  endpoint.api //
    .get<IUser>('/v2/users/me')
    .then((r) => r.data);

/** NOTE: This is not a "failure" error. MFA flows use a 403 to issue their MFA challenges. */
export interface IMFARequiredError {
  error: 'mfa_required';
  error_description?: string;
  mfa_token: string;
}

/** @see IMFARequiredError */
export interface IMFARequiredAxiosError {
  response: {
    status: 403;
    data: IMFARequiredError;
  };
}

/**
 * Type guard for the `mfa_required` challenge. A sign-in for a user with MFA enabled fails with
 * a 403 carrying `{error: 'mfa_required', mfa_token}`, and the app finishes the sign-in with an
 * mfa grant. Use `getMFAChallenge()` instead if it is easier to work with the body directly.
 *
 * ```typescript
 * import {authenticate, isMFARequired, VerdocsEndpoint} from '@verdocs/js-sdk';
 *
 * try {
 *   const {access_token} = await authenticate(VerdocsEndpoint.getDefault(), {grant_type: 'password', username, password});
 * } catch (e) {
 *   if (isMFARequired(e)) {
 *     const {mfa_token} = e.response.data;
 *     // Collect a code from the user, then:
 *     const {access_token} = await authenticate(VerdocsEndpoint.getDefault(), {
 *       grant_type: 'urn:verdocs:params:oauth:grant-type:mfa-otp', mfa_token, otp});
 *   }
 * }
 * ```
 *
 * @sdkOperation auth.isMFARequired
 * @sdkGroup Auth
 * @sdkPage Helpers
 */
export const isMFARequired = (e: unknown): e is IMFARequiredAxiosError => {
  const response = (e as IMFARequiredAxiosError)?.response;
  return response?.status === 403 && response?.data?.error === 'mfa_required' && typeof response?.data?.mfa_token === 'string';
};

/**
 * Companion to `isMFARequired()` that returns the challenge body, or null if the error is
 * something else. Handy in `catch` blocks that just need the `mfa_token`.
 *
 * ```typescript
 * import {getMFAChallenge} from '@verdocs/js-sdk';
 *
 * const challenge = getMFAChallenge(e);
 * if (challenge) {
 *   // Switch the form to its "enter your code" mode, carrying challenge.mfa_token.
 * }
 * ```
 *
 * @sdkOperation auth.getMFAChallenge
 * @sdkGroup Auth
 * @sdkPage Helpers
 */
export const getMFAChallenge = (e: unknown): IMFARequiredError | null => (isMFARequired(e) ? e.response.data : null);

/**
 * Get the identity providers enabled in the current environment. Google and Microsoft are
 * configured per-environment, and a provider that is not configured will 404 from its sign-in
 * URL, so call this before rendering provider buttons and hide the ones that are off.
 *
 * ```typescript
 * import {getSocialProviders, VerdocsEndpoint} from '@verdocs/js-sdk';
 *
 * const {google, microsoft} = await getSocialProviders(VerdocsEndpoint.getDefault());
 * ```
 *
 * @group Authentication
 * @api GET /v2/oauth2/social/providers Get the identity providers enabled in this environment
 * @apiSuccess ISocialProviders . The enabled providers
 *
 * @sdkOperation auth.getSocialProviders
 * @sdkGroup Auth
 * @sdkPage Endpoints
 */
export const getSocialProviders = (endpoint: VerdocsEndpoint) =>
  endpoint.api //
    .get<ISocialProviders>('/v2/oauth2/social/providers')
    .then((r) => r.data);

/**
 * Build the URL that starts a Google or Microsoft sign-in. Send the browser to it. The provider
 * exchange happens server-side, and the user comes back to `returnUri` with `login_code` and
 * `state` query parameters. Exchange the code for tokens with `authenticate()` using the
 * `login-code` grant and the verifier that produced `codeChallenge`.
 *
 * ```typescript
 * import {authenticate, createCodeChallenge, createCodeVerifier, getSocialLoginUrl, VerdocsEndpoint} from '@verdocs/js-sdk';
 *
 * // Starting the flow. Keep the verifier and state in sessionStorage, the browser is leaving.
 * const code_verifier = createCodeVerifier();
 * const codeChallenge = await createCodeChallenge(code_verifier);
 * const state = createCodeVerifier();
 * sessionStorage.setItem('verdocs_pkce', JSON.stringify({code_verifier, state}));
 * window.location.href = getSocialLoginUrl(VerdocsEndpoint.getDefault(), 'google', {
 *   returnUri: 'https://your-app.com/login', codeChallenge, state});
 *
 * // Back at returnUri, with ?login_code=...&state=...
 * const {access_token} = await authenticate(VerdocsEndpoint.getDefault(), {
 *   grant_type: 'urn:verdocs:params:oauth:grant-type:login-code', login_code, code_verifier});
 * ```
 *
 * @group Authentication
 * @api GET /v2/oauth2/social/:provider/start Begin a Google or Microsoft sign-in
 * @apiParam string(enum: 'google'|'microsoft') provider The identity provider to sign in with.
 * @apiQuery string(format: 'uri') return_uri Where to send the user after the provider returns. Must belong to a registered origin.
 * @apiQuery string code_challenge The PKCE challenge, the base64url SHA-256 of the verifier the app keeps.
 * @apiQuery string(enum: 'S256') code_challenge_method Always 'S256'.
 * @apiQuery string state An opaque value returned unchanged to the app, used to prevent CSRF attacks.
 *
 * @sdkOperation auth.getSocialLoginUrl
 * @sdkGroup Auth
 * @sdkPage Endpoints
 */
export const getSocialLoginUrl = (
  endpoint: VerdocsEndpoint,
  provider: TSocialLoginProvider,
  params: {returnUri: string; codeChallenge: string; state: string},
): string => {
  const baseUrl = endpoint.getBaseURL?.() || 'https://api.verdocs.com';
  const url = new URL(`/v2/oauth2/social/${provider}/start`, baseUrl);
  url.searchParams.set('return_uri', params.returnUri);
  url.searchParams.set('code_challenge', params.codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('state', params.state);
  return url.toString();
};

const getWebCrypto = (): Crypto => {
  const webCrypto = globalThis.crypto;
  if (!webCrypto?.subtle) {
    throw new Error('WebCrypto is unavailable. PKCE requires a secure context in browsers, or Node 18 or later.');
  }

  return webCrypto;
};

const base64UrlEncode = (bytes: Uint8Array): string => {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return globalThis.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

/**
 * Create a PKCE code verifier: 43 characters of URL-safe randomness, per RFC 7636. Keep it where
 * it will survive the round trip to the provider (`sessionStorage` in a browser), pass its
 * challenge to `getSocialLoginUrl()`, and send it back with the `login-code` grant.
 *
 * ```typescript
 * import {createCodeVerifier} from '@verdocs/js-sdk';
 *
 * const verifier = createCodeVerifier();
 * ```
 *
 * @sdkOperation auth.createCodeVerifier
 * @sdkGroup Auth
 * @sdkPage Helpers
 */
export const createCodeVerifier = (): string => base64UrlEncode(getWebCrypto().getRandomValues(new Uint8Array(32)));

/**
 * Create the PKCE code challenge for a verifier: the base64url-encoded SHA-256 of it. Isomorphic,
 * using WebCrypto in both browsers and Node 18 or later.
 *
 * ```typescript
 * import {createCodeChallenge, createCodeVerifier} from '@verdocs/js-sdk';
 *
 * const verifier = createCodeVerifier();
 * const challenge = await createCodeChallenge(verifier);
 * ```
 *
 * @sdkOperation auth.createCodeChallenge
 * @sdkGroup Auth
 * @sdkPage Helpers
 */
export const createCodeChallenge = async (verifier: string): Promise<string> => {
  const digest = await getWebCrypto().subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64UrlEncode(new Uint8Array(digest));
};
