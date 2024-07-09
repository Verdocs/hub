/**
 * An Organization is the top level object for ownership for Members, Documents, and Templates.
 *
 * @module
 */

import {VerdocsEndpoint} from '../VerdocsEndpoint';
import {IOrganization} from '../Models';

/**
 * Get a list of organizations the caller is a member of.
 */
export const getOrganizations = (endpoint: VerdocsEndpoint) =>
  endpoint.api //
    .get<IOrganization[]>('/v2/organizations')
    .then((r) => r.data);

/**
 * Get an organization by ID.
 */
export const getOrganization = (endpoint: VerdocsEndpoint, organizationId: string) =>
  endpoint.api //
    .get<IOrganization>(`/v2/organizations/${organizationId}`)
    .then((r) => r.data);

/**
 * Create an organization.
 */
export const createOrganization = (endpoint: VerdocsEndpoint) =>
  endpoint.api //
    .post<IOrganization>('/v2/organizations')
    .then((r) => r.data);

/**
 * Delete an organization.
 */
export const deleteOrganization = (endpoint: VerdocsEndpoint, organizationId: string) =>
  endpoint.api //
    .delete(`/v2/organizations/${organizationId}`)
    .then((r) => r.data);

/**
 * Update an organization.
 */
export const updateOrganization = (endpoint: VerdocsEndpoint, organizationId: string, params: Partial<IOrganization>) =>
  endpoint.api //
    .patch<IOrganization>(`/v2/organizations/${organizationId}`, params)
    .then((r) => r.data);
