import {Endpoint, StandardDataReponse} from './Endpoint';

export const getWebhook = (organizationId: string) =>
  Endpoint.get(`/organizations/${organizationId}/webhook`).then(StandardDataReponse);

export const updateWebhook = (organizationId: string, params: any) =>
  Endpoint.post(`/organizations/${organizationId}/webhook`, params).then(StandardDataReponse);
