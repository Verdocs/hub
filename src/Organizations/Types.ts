import {TApiKeyPermission, TEventName, TNotificationType, type TWebhookAuthMethod, TWebhookEvent} from '../BaseTypes';
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
  client_id?: string | null;
  client_secret?: string | null;
  scope?: string | null;
  token_endpoint?: string | null;
  auth_method: TWebhookAuthMethod;
  events: Record<TWebhookEvent, boolean>;
}

export interface ICreateBrandRequest {
  key: string;
  name?: string;
  full_logo_url?: string;
  thumbnail_url?: string;
  favicon_url?: string;
  page_title?: string;
  primary_color?: string;
  secondary_color?: string;
  powered_by_label?: string;
  powered_by_url?: string;
  style_overrides?: string;
  disclaimer?: string;
  terms_use_url?: string;
  privacy_policy_url?: string;
  support_contact?: string;
  pdf_signature_reason?: string;
  pdf_signature_location?: string;
  timezone?: string | null;
  locale?: string | null;
}

export interface IUpdateBrandRequest {
  name?: string | null;
  full_logo_url?: string | null;
  thumbnail_url?: string | null;
  favicon_url?: string | null;
  page_title?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  powered_by_label?: string | null;
  powered_by_url?: string | null;
  style_overrides?: string | null;
  disclaimer?: string | null;
  terms_use_url?: string | null;
  privacy_policy_url?: string | null;
  support_contact?: string | null;
  pdf_signature_reason?: string | null;
  pdf_signature_location?: string | null;
  timezone?: string | null;
  locale?: string | null;
}

export interface IAddBrandEmailDomainRequest {
  subdomain: string;
  local_part: string;
  display_name?: string;
  reply_to?: string;
}

export interface ICreateNotificationTemplateRequest {
  type: TNotificationType;
  event_name: TEventName;
  template_id?: string;
  html_template?: string;
  text_template?: string;
}

export interface IUpdateNotificationTemplateRequest {
  html_template?: string;
  text_template?: string;
}
