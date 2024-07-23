import type {TRequestStatus} from '../BaseTypes';
import {TPermission, TRole} from '../Sessions';

export interface ICreateProfileRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  org_name: string;
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
