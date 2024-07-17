export interface ISigningSessionRequest {
  envelopeId: string;
  roleId: string;
  inviteCode: string;
}

/**
 * A Signing Session connects a caller to a role within an envelope, and can be used only for calls related to signing that envelope.
 */
export interface ISigningSession {
  profile_id: string;
  envelope_id: string;
  role: string;
  email: string;
  access_key: {
    id: string;
    type: string;
  };
  iss: string;
  aud: string;
  exp: number;
  iat: number;

  [key: string]: any;
}

/**
 * A User Session connects a caller to a Verdocs profile, and can be used for any operations that profile may perform.
 */
export interface IUserSession {
  aud: string;
  iss: string;
  sub: string;
  email: string;
  email_verified: boolean;
  iat: number;
  exp: number;
  'https://verdocs.com/profile_id': string;
  'https://verdocs.com/organization_id': string;
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
