import {Endpoint} from '../HTTP/Transport';

export const getWebhook = (organizationId: string) =>
  Endpoint.get(`/organizations/${organizationId}/webhook`).then((r) => r.data);

export const updateWebhook = (organizationId: string, params: any) =>
  Endpoint.post(`/organizations/${organizationId}/webhook`, params).then((r) => r.data);
