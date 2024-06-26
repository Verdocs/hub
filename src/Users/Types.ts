import {TPermission, TPlan, TRequestStatus, TRole} from '../BaseTypes';
import {IApiKey, IGroup, IGroupProfile, IInitial, INotification, IOAuth2App, IOrganization, IProfile, ISignature} from '../Models';

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
  // email?: string;
  phone?: string;
  permissions?: TPermission[];
  roles?: TRole[];
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
