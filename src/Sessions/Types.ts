import {IProfile, TPermission, TPlan, TRole} from '../Users/Types';

export interface ISigningSessionRequest {
  envelopeId: string;
  roleId: string;
  inviteCode: string;
}

/** A Signing Session connects a caller to a role within an envelope, and can be used only for calls related to signing that envelope. */
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

/** A User Session connects a caller to a Verdocs profile, and can be used for any operations that profile may perform. */
export interface IUserSession {
  sub: string;
  email: string;
  email_verified: boolean;
  iat: number;
  exp: number;
  permissions: TPermission[];
  roles: TRole[];
  profile: IProfile;
  profile_id: string;
  organization_id: string;
  plans?: TPlan[];

  [key: string]: any;
}

export type TSessionType = 'user' | 'signing';

export type TSession = IUserSession | ISigningSession | null;
