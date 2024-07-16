import {TApiKeyPermission, TRole} from '../BaseTypes';

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
