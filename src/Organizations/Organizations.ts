import {Endpoint} from '../HTTP/Transport';
import {IOrganization} from './Types';

export const getOrganizations = () => Endpoint.get<IOrganization[]>('/organizations').then((r) => r.data);

export const createOrganization = () => Endpoint.post<IOrganization>('/organizations').then((r) => r.data);

export const validateOrganization = () => Endpoint.get<IOrganization>('/organizations/is_valid').then((r) => r.data);

export const deleteOrganization = (organizationId: string) =>
  Endpoint.delete(`/organizations/${organizationId}`).then((r) => r.data);

export const getOrganization = (organizationId: string) =>
  Endpoint.get(`/organizations/${organizationId}`).then((r) => r.data);

export const updateOrganization = (organizationId: string, params: any) =>
  Endpoint.patch(`/organizations/${organizationId}`, params).then((r) => r.data);
