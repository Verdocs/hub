/**
 * An Organization is the top level object for ownership for Members, Documents, and Templates.
 *
 * @module
 */

import {IOrganization} from './Types';
import {VerdocsEndpoint} from '../VerdocsEndpoint';

export const getOrganizations = (endpoint: VerdocsEndpoint) =>
  endpoint.api //
    .get<IOrganization[]>('/organizations')
    .then((r) => r.data);

export const createOrganization = (endpoint: VerdocsEndpoint) =>
  endpoint.api //
    .post<IOrganization>('/organizations')
    .then((r) => r.data);

export const validateOrganization = (endpoint: VerdocsEndpoint) =>
  endpoint.api //
    .get<IOrganization>('/organizations/is_valid')
    .then((r) => r.data);

export const deleteOrganization = (endpoint: VerdocsEndpoint, organizationId: string) =>
  endpoint.api //
    .delete(`/organizations/${organizationId}`)
    .then((r) => r.data);

export const getOrganization = (endpoint: VerdocsEndpoint, organizationId: string) =>
  endpoint.api //
    .get(`/organizations/${organizationId}`)
    .then((r) => r.data);

export const updateOrganization = (endpoint: VerdocsEndpoint, organizationId: string, params: any) =>
  endpoint.api //
    .patch(`/organizations/${organizationId}`, params)
    .then((r) => r.data);
