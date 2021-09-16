import {Endpoint, StandardDataReponse} from './Endpoint';

export interface IOrganization {
  /** The unique ID of the organization */
  id: string;
  /** The organization's name. */
  name: string;
  address: string | null;
  phone: string | null;
  /** If the organization is a business, its name. Note that a business name can be different from an organization name. */
  business_name: string | null;
  /** If true, the organization is a business */
  is_business: boolean;
  address2: string | null;
  contact_email: string | null;
  timezone: string | null;
  envelope_responsible: boolean;
}

export const getOrganizations = () => Endpoint.get<IOrganization[]>('/organizations').then(StandardDataReponse);

export const createOrganization = () => Endpoint.post<IOrganization>('/organizations').then(StandardDataReponse);

export const validateOrganization = () =>
  Endpoint.get<IOrganization>('/organizations/is_valid').then(StandardDataReponse);

export const deleteOrganization = (organizationId: string) =>
  Endpoint.delete(`/organizations/${organizationId}`).then(StandardDataReponse);

export const getOrganization = (organizationId: string) =>
  Endpoint.get(`/organizations/${organizationId}`).then(StandardDataReponse);

export const updateOrganization = (organizationId: string, params: any) =>
  Endpoint.patch(`/organizations/${organizationId}`, params).then(StandardDataReponse);
