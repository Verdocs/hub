import type {TRequestStatus} from '../BaseTypes';
import {TPermission, TRole} from '../Sessions';

export interface ICreateProfileRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  org_name: string;
  phone: string;
  timezone?: string | null;
  locale?: string | null;
}

export interface IUpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  // email?: string;
  phone?: string;
  timezone?: string | null;
  locale?: string | null;
  permissions?: TPermission[];
  roles?: TRole[];
}

export interface IAuthenticateResponse {
  access_token: string;
  id_token: string;
  refresh_token: string;
  expires_in: number;
  access_token_exp: number;
  refresh_token_exp: number;
}

export interface IChangePasswordRequest {
  old_password: string;
  new_password: string;
}

export interface IChangePasswordResponse {
  status: TRequestStatus;
  message: string;
}

export interface IResetPasswordRequest {
  email: string;
}

export interface IResetPasswordResponse {
  status: 'OK';
}

export interface IVerifyEmailRequest {
  email: string;
  token: string;
}

/**
 * Server-side record of a login session (not to be confused with IUserSession, a client-side tracker for a decoded JWT.
 */
export interface IUserLoginSession {
  id: string;
  current: boolean;
  /** Typically a TSignInProvider, but typed as a string to allow patterns e.g. 'oauth2:CLIENTID'. */
  source: string;
  created_at: string;
  last_seen_at: string;
  /** We don't store the full User-Agent (to prevent its reuse in replay attacks) but we do track the browser name, platform, and desktop/mobile. */
  browser: string | null;
  platform: string | null;
  mobile: boolean;
  /** We don't track fine-grained location data but we do track approximate location eg. City/State/Country. */
  location: string | null;
  /**
   * Partially-masked IP address the session was created from e.g. '73.***.***.14'.
   * NOTE: Per our Privacy Policy and EULA we do track and store full IP addresses internally. Document signing sessions do not
   * have the same expectation of privacy that other Web-based operations often do. We mask them here in this record because
   * these sessions may or may not be signing documents so a full IP is not needed.
   */
  ip_address: string | null;
}

/**
 * The result of revoking the caller's other sessions.
 */
export interface IRevokeSessionsResponse {
  /** The number of sessions revoked. The caller's current session is never included. */
  revoked: number;
}

/**
 * The type of second factor enrolled. Only time-based one-time passwords are supported today.
 */
export type TMFAType = 'totp';

/**
 * The caller's multi-factor authentication status.
 */
export interface IMFAStatus {
  /** True if the caller has completed MFA enrollment. */
  enabled: boolean;
  /** The type of second factor enrolled, or null if MFA is not enabled. */
  type: TMFAType | null;
  /** When MFA was enabled (ISO8601), or null if it is not enabled. */
  enrolled_at: string | null;
  /** The number of unused backup codes remaining. */
  backup_codes_remaining: number;
}

/**
 * A pending MFA enrollment. The secret is not active until it is confirmed with `verifyMFAEnrollment()`.
 */
export interface IMFAEnrollment {
  /** The base32-encoded TOTP secret, for users who cannot scan a QR code. */
  secret: string;
  /** The `otpauth://` URI to render as a QR code for authenticator apps. */
  otpauth_url: string;
  /** When the pending enrollment expires (ISO8601) if it is not confirmed. */
  expires_at: string;
}

/**
 * A set of one-time backup codes. These are returned only once, at the moment they are generated.
 */
export interface IMFABackupCodes {
  /** Single-use backup codes, formatted 'xxxx-xxxx'. Each may be used once in place of a TOTP code. */
  backup_codes: string[];
}

/**
 * An identity provider that may be used to sign in to Verdocs.
 */
export type TSocialLoginProvider = 'google' | 'microsoft';

/**
 * The identity providers enabled in the current environment. Buttons for providers that are not
 * enabled should be hidden, because their sign-in URLs will return 404.
 */
export interface ISocialProviders {
  google: boolean;
  microsoft: boolean;
}
