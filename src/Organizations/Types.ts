import {TApiKeyPermission} from '../BaseTypes';
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
  events: {
    envelope_created: boolean;
    envelope_completed: boolean;
    envelope_canceled: boolean;

    template_created: boolean;
    template_updated: boolean;
    template_deleted: boolean;
    template_used: boolean;
  };
}
