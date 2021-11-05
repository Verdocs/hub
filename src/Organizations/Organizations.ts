/**
 * An Organization is the top level object for ownership for Members, Documents, and Templates.
 *
 * @module
 */

import {getEndpoint} from '../HTTP/Transport';
import {IOrganization} from './Types';

export const getOrganizations = () =>
  getEndpoint()
    .get<IOrganization[]>('/organizations')
    .then((r) => r.data);

export const createOrganization = () =>
  getEndpoint()
    .post<IOrganization>('/organizations')
    .then((r) => r.data);

export const validateOrganization = () =>
  getEndpoint()
    .get<IOrganization>('/organizations/is_valid')
    .then((r) => r.data);

export const deleteOrganization = (organizationId: string) =>
  getEndpoint()
    .delete(`/organizations/${organizationId}`)
    .then((r) => r.data);

export const getOrganization = (organizationId: string) =>
  getEndpoint()
    .get(`/organizations/${organizationId}`)
    .then((r) => r.data);

export const updateOrganization = (organizationId: string, params: any) =>
  getEndpoint()
    .patch(`/organizations/${organizationId}`, params)
    .then((r) => r.data);
