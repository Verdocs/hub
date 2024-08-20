import {TApiKeyPermission, TWebhookEvent} from '../BaseTypes';
import {TRole} from '../Sessions';

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
  events: Record<TWebhookEvent, boolean>;
}
