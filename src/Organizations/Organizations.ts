/**
 * An Organization is the top level object for ownership for Members, Documents, and Templates.
 *
 * @module
 */

import {VerdocsEndpoint} from '../VerdocsEndpoint';
import {IOrganization, type IProfile} from '../Models';

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

/**
 * Update the organization's logo. This can only be called by an admin or owner of the organization.
 *
 * ```typescript
 * import {uploadOrganizationLogo} from '@verdocs/js-sdk';
 *
 * await uploadOrganizationLogo((VerdocsEndpoint.getDefault(), file);
 * ```
 */
export const uploadOrganizationLogo = (
  endpoint: VerdocsEndpoint,
  file: File,
  onUploadProgress?: (percent: number, loadedBytes: number, totalBytes: number) => void,
) => {
  const formData = new FormData();
  formData.append('document', file, file.name);

  return endpoint.api //
    .post<IProfile>(`/v2/organizations/logo`, formData, {
      timeout: 120000,
      onUploadProgress: (event) => {
        const total = event.total || 1;
        const loaded = event.loaded || 0;
        onUploadProgress?.(Math.floor((loaded * 100) / (total || 1)), loaded, total || 1);
      },
    })
    .then((r) => r.data);
};

/**
 * Update the organization's thumbnail. This can only be called by an admin or owner of the organization.
 *
 * ```typescript
 * import {uploadOrganizationThumbnail} from '@verdocs/js-sdk';
 *
 * await uploadOrganizationThumbnail((VerdocsEndpoint.getDefault(), file);
 * ```
 */
export const uploadOrganizationThumbnail = (
  endpoint: VerdocsEndpoint,
  file: File,
  onUploadProgress?: (percent: number, loadedBytes: number, totalBytes: number) => void,
) => {
  const formData = new FormData();
  formData.append('document', file, file.name);

  return endpoint.api //
    .post<IProfile>(`/v2/organizations/thumbnail`, formData, {
      timeout: 120000,
      onUploadProgress: (event) => {
        const total = event.total || 1;
        const loaded = event.loaded || 0;
        onUploadProgress?.(Math.floor((loaded * 100) / (total || 1)), loaded, total || 1);
      },
    })
    .then((r) => r.data);
};
