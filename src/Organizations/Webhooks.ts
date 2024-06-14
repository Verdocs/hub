import {VerdocsEndpoint} from '../VerdocsEndpoint';
import {ISetWebhookRequest} from './Types';
import {IWebhook} from '../Models';

export const getWebhooks = (endpoint: VerdocsEndpoint) =>
  endpoint.api //
    .get<IWebhook>(`/v2/webhooks/organization`)
    .then((r) => r.data);

export const setWebhooks = (endpoint: VerdocsEndpoint, params: ISetWebhookRequest) =>
  endpoint.api //
    .post<IWebhook>(`/v2/webhooks/organization`, params)
    .then((r) => r.data);
