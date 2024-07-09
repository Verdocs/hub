import type {TPermission, TRequestStatus, TRole} from '../BaseTypes';
import type {IProfile} from '../Models';

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

export interface ICreateAccountRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  orgName: string;
}
