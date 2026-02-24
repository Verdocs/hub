import {TApiKeyPermission, type TWebhookAuthMethod, TWebhookEvent} from '../BaseTypes';
import {TRole} from '../Sessions';
import {IWebhookEvents} from '../Models';

export interface ICreateApiKeyRequest {
  name: string;
  profile_id: string;
  permission: TApiKeyPermission;
}

export interface IUpdateApiKeyRequest {
  name?: string;
  permission?: TApiKeyPermission;
}

export interface ICreateInvitationRequest {
  email: string;
  first_name: string;
  last_name: string;
  role: TRole;
}

export interface IAcceptOrganizationInvitationRequest {
  email: string;
  token: string;
  first_name: string;
  last_name: string;
  password: string;
}

export interface ISetWebhookRequest {
  url: string;
  active: boolean;
  client_id?: string | null;
  client_secret?: string | null;
  scope?: string | null;
  token_endpoint?: string | null;
  auth_method: TWebhookAuthMethod;
  events: Record<TWebhookEvent, boolean>;
}
