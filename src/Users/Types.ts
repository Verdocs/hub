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
  accessToken: string;
  idToken: string;
  refreshToken: string;
  accessTokenExp: number;
  refreshTokenExp: number;
}

export interface IUpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  // email?: string;
  phone?: string;
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

export interface IUpdatePasswordRequest {
  email: string;
  oldPassword: string;
  newPassword: string;
}

export interface IUpdatePasswordResponse {
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
