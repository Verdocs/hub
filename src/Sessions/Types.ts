import {TAccessKeyType} from '../BaseTypes';

/**
 * A Signing Session connects a caller to a role within an envelope, and can be used only for calls related to signing that envelope.
 */
export interface ISigningSession {
  aud: string;
  iss: string;
  sub: string; // Verdocs access key ID
  iat: number;
  exp: number;
  session_type: 'signing';
  key_type: TAccessKeyType;
  email: string;
  profile_id: string;
  envelope_id: string;
  role_name: string;
  // @deprecated
  ['https://verdocs.com/session_type']: 'signing';
  // @deprecated
  ['https://verdocs.com/key_type']: TAccessKeyType;
  // @deprecated
  ['https://verdocs.com/envelope_id']: string;
  // @deprecated
  ['https://verdocs.com/role_name']: string;
}

/**
 * A User Session connects a caller to a Verdocs profile, and can be used for any operations that profile may perform.
 */
export interface IUserSession {
  jti: string;
  aud: string;
  iss: string;
  sub: string; // Verdocs user_id
  iat: number;
  exp: number;
  session_type: 'user';
  email: string;
  profile_id: string;
  organization_id: string;
  global_admin: boolean;
  // @deprecated
  ['https://verdocs.com/session_type']: 'user';
  // @deprecated
  ['https://verdocs.com/profile_id']: string;
  // @deprecated
  ['https://verdocs.com/organization_id']: string;
  // @deprecated
  ['https://verdocs.com/global_admin']: boolean;
}

export interface IIdToken {
  aud: string;
  iss: string;
  sub: string; // Verdocs user_id
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
