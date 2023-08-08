/**
 * An Organization is the top level object for ownership for Members, Documents, and Templates.
 *
 * @module
 */

import {IOrganization} from './Types';
import {VerdocsEndpoint} from '../VerdocsEndpoint';

/**
 * Get a list of organizations the user has access to.
 */
export const getOrganizations = (endpoint: VerdocsEndpoint) =>
  endpoint.api //
    .get<IOrganization[]>('/organizations')
    .then((r) => r.data);

/**
 * Create an organization.
 */
export const createOrganization = (endpoint: VerdocsEndpoint) =>
  endpoint.api //
    .post<IOrganization>('/organizations')
    .then((r) => r.data);

/**
 * Delete an organization.
 */
export const deleteOrganization = (endpoint: VerdocsEndpoint, organizationId: string) =>
  endpoint.api //
    .delete(`/organizations/${organizationId}`)
    .then((r) => r.data);

/**
 * Get an organization by ID.
 */
export const getOrganization = (endpoint: VerdocsEndpoint, organizationId: string) =>
  endpoint.api //
    .get<IOrganization>(`/organizations/${organizationId}`)
    .then((r) => r.data);

/**
 * Update an organization.
 */
export const updateOrganization = (endpoint: VerdocsEndpoint, organizationId: string, params: any) =>
  endpoint.api //
    .patch<IOrganization>(`/organizations/${organizationId}`, params)
    .then((r) => r.data);

/**
 * Check if an organization name is available. Typically used during the sign-up process. This endpoint is rate-limited
 * to prevent abuse. Developers experiencing problems with testing new applications should contact support.
 */
export const isOrgAvailable = (endpoint: VerdocsEndpoint, name: string) =>
  endpoint.api //
    .post<'TAKEN' | 'OK'>('/organizations/check-availability', {name}, {baseURL: endpoint.getBaseURLv2()})
    .then((r) => r.data);
