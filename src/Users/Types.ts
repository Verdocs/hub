import type {TRequestStatus} from '../BaseTypes';
import {TPermission, TRole} from '../Sessions';

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
  old_password: string;
  new_password: string;
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
