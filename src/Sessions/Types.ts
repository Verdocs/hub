import {TAccessKeyType} from '../BaseTypes';

/**
 * A Signing Session connects a caller to a role within an envelope, and can be used only for calls related to signing that envelope.
 */
export interface ISigningSession {
  aud: string;
  iss: string;
  sub: string; // Verdocs access key ID
  email: string;
  iat: number;
  exp: number;
  'https://verdocs.com/key_type': TAccessKeyType;
  'https://verdocs.com/session_type': 'signing';
  'https://verdocs.com/envelope_id': string;
  'https://verdocs.com/role_name': string;
}

/**
 * A User Session connects a caller to a Verdocs profile, and can be used for any operations that profile may perform.
 */
export interface IUserSession {
  jti: string;
  aud: string;
  iss: string;
  sub: string; // Auth0 user_id
  email: string;
  iat: number;
  exp: number;
  'https://verdocs.com/session_type': 'user';
  'https://verdocs.com/profile_id': string;
  'https://verdocs.com/organization_id': string;
}

export interface IIdToken {
  aud: string;
  iss: string;
  sub: string; // Auth0 user_id
  email: string;
  organization_id: string;
  first_name: string;
  last_name: string;
  phone: string;
}
/**
 * Verdocs supports two types of authenticated sessions: User and Signing. Both behave similarly and have similar
 * properties, but signing sessions only have access to a small set of signing-related functions.
 */
export type TSessionType = 'user' | 'signing';

/**
 * Represents a possibly-authenticated session within Verdocs, either for signing or regular user-based operations.
 */
export type TSession = IUserSession | ISigningSession | null;

/**
 * An active authenticated session within Verdocs, either for signing or regular user-based operations.
 */
export type TActiveSession = IUserSession | ISigningSession;
