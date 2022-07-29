import {VerdocsEndpoint} from '../VerdocsEndpoint';

export const getWebhook = (endpoint: VerdocsEndpoint, organizationId: string) =>
  endpoint.api //
    .get(`/organizations/${organizationId}/webhook`)
    .then((r) => r.data);

export const updateWebhook = (endpoint: VerdocsEndpoint, organizationId: string, params: any) =>
  endpoint.api //
    .post(`/organizations/${organizationId}/webhook`, params)
    .then((r) => r.data);
