import {VerdocsEndpoint} from '../VerdocsEndpoint';

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

export interface IWebhook {
  id: string;
  organization_id: string;
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
  status: string;
  last_success: string;
  last_failure: string;
}

export const getWebhooks = (endpoint: VerdocsEndpoint) =>
  endpoint.api //
    .get<IWebhook>(`/v2/webhooks/organization`)
    .then((r) => r.data);

export const setWebhooks = (endpoint: VerdocsEndpoint, params: ISetWebhookRequest) =>
  endpoint.api //
    .post<IWebhook>(`/v2/webhooks/organization`, params)
    .then((r) => r.data);
