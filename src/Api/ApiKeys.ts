import {Endpoint, StandardDataReponse} from './Endpoint';

export const getApiKeys = (organizationId: string) =>
  Endpoint.get(`/organizations/${organizationId}/api_key`).then(StandardDataReponse);

export const createApiKey = (organizationId: string, params: any) =>
  Endpoint.post(`/organizations/${organizationId}/api_key`, params).then(StandardDataReponse);

export const rotateApiKey = (organizationId: string, clientId: string) =>
  Endpoint.put(`/organizations/${organizationId}/api_key/${clientId}/rotate`).then(StandardDataReponse);

export const updateApiKey = (organizationId: string, clientId: string, params: any) =>
  Endpoint.patch(`/organizations/${organizationId}/api_key/${clientId}`, params).then(StandardDataReponse);

export const deleteApiKey = (organizationId: string, clientId: string, params: any) =>
  Endpoint.delete(`/organizations/${organizationId}/api_key/${clientId}`, params).then(StandardDataReponse);
