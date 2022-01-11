import {getEndpoint} from '../HTTP/Transport';

export const getWebhook = (organizationId: string) =>
  getEndpoint()
    .api.get(`/organizations/${organizationId}/webhook`)
    .then((r) => r.data);

export const updateWebhook = (organizationId: string, params: any) =>
  getEndpoint()
    .api.post(`/organizations/${organizationId}/webhook`, params)
    .then((r) => r.data);
