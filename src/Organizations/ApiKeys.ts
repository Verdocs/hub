import {Endpoint} from '../HTTP/Endpoint';

export const getApiKeys = (organizationId: string) =>
  Endpoint.get(`/organizations/${organizationId}/api_key`).then((r) => r.data);

export const createApiKey = (organizationId: string, params: any) =>
  Endpoint.post(`/organizations/${organizationId}/api_key`, params).then((r) => r.data);

export const rotateApiKey = (organizationId: string, clientId: string) =>
  Endpoint.put(`/organizations/${organizationId}/api_key/${clientId}/rotate`).then((r) => r.data);

export const updateApiKey = (organizationId: string, clientId: string, params: any) =>
  Endpoint.patch(`/organizations/${organizationId}/api_key/${clientId}`, params).then((r) => r.data);

export const deleteApiKey = (organizationId: string, clientId: string, params: any) =>
  Endpoint.delete(`/organizations/${organizationId}/api_key/${clientId}`, params).then((r) => r.data);
