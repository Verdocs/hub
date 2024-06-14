import {TTemplatePermission} from '../Templates/Types';
import {TOrgPermission} from '../Organizations/Types';
import {IProfile} from '../Models';

export type TRequestStatus = 'OK' | 'ERROR';

export type TAccountPermission =
  | 'owner:add'
  | 'owner:remove'
  | 'admin:add'
  | 'admin:remove'
  | 'member:view'
  | 'member:add'
  | 'member:remove';

/**
 * Operation within Verdocs that users may perform.
 */
export type TPermission = TTemplatePermission | TOrgPermission | TAccountPermission;

/**
 * Plans provide access to Verdocs product features.
 */
export type TPlan = 'env:essential' | 'org:standard';

/**
 * Roles provide access to groups of permissions. Note that for historical reasons there is some overlap in the
 * use of the term "role". TRole refers to a user type. A "Role" (IRole) is a Template participant placeholder.
 */
export type TRole = 'contact' | 'basic_user' | 'member' | 'admin' | 'owner';

export interface ICreateProfileRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
}

export interface ISwitchProfileResponse {
  profile: IProfile;
  idToken: string;
  accessToken: string;
  refreshToken: string;
}

export interface IUpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  phone?: string;
}

export interface IAuthenticateUserRequest {
  username: string;
  password: string;
}

export interface IAuthenticateAppRequest {
  client_id: string;
  client_secret: string;
}

export interface IAuthenticateResponse {
  idToken: string;
  accessToken: string;
  refreshToken: string;
}

export interface TokenValidationRequest {
  token: string;
}

export interface TokenValidationResponse {
  /** True if the token is valid */
  valid: boolean;
  /** The decoded and validated body of the JWT */
  payload: any;
}

export interface IUpdatePasswordRequest {
  email: string;
  oldPassword: string;
  newPassword: string;
}

export interface UpdatePasswordResponse {
  status: TRequestStatus;
  /** Success or failure message */
  message: string;
}

export interface UpdateEmailRequest {
  email: string;
}

export interface UpdateEmailResponse {
  profiles: IProfile[];
}

export interface ICreateBusinessAccountRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  orgName: string;
}

export interface ICreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  fromInviteCode: string;
}
