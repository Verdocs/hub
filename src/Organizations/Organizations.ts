/**
 * An Organization is the top level object for ownership for Members, Documents, and Templates.
 *
 * NOTE: There is no call specifically to create an organization. Every organization must have
 * at least one "owner" type member. To create a new organization, call createProfile() with
 * the desired new orgName to create. The caller will become the first owner of the new org, and
 * can then invite new members to join as well.
 *
 * NOTE: There is no call to delete an organization. For safety, this is a manual process. Please
 * contact support@verdocs.com if you wish to completely delete an organization and all its records.
 *
 * @module
 */

import {VerdocsEndpoint} from '../VerdocsEndpoint';
import {IOrganization, type IProfile} from '../Models';

/**
 * Get a list of organizations the caller is a member of.
 *
 * ```typescript
 * import {getOrganizations} from '@verdocs/js-sdk';
 *
 * const organizations = await getOrganizations(VerdocsEndpoint.getDefault());
 * ```
 */
export const getOrganizations = (endpoint: VerdocsEndpoint) =>
  endpoint.api //
    .get<IOrganization[]>('/v2/organizations')
    .then((r) => r.data);

/**
 * Get an organization by ID.
 *
 * ```typescript
 * import {getOrganization} from '@verdocs/js-sdk';
 *
 * const organizations = await getOrganization(VerdocsEndpoint.getDefault(), 'ORGID');
 * ```
 */
export const getOrganization = (endpoint: VerdocsEndpoint, organizationId: string) =>
  endpoint.api //
    .get<IOrganization>(`/v2/organizations/${organizationId}`)
    .then((r) => r.data);

/**
 * Update an organization.  This can only be called by an admin or owner.
 *
 * ```typescript
 * import {updateOrganization} from '@verdocs/js-sdk';
 *
 * const organizations = await updateOrganization(VerdocsEndpoint.getDefault(), organizationId, {name:'ORGNAME'});
 * ```
 */
export const updateOrganization = (endpoint: VerdocsEndpoint, organizationId: string, params: Partial<IOrganization>) =>
  endpoint.api //
    .patch<IOrganization>(`/v2/organizations/${organizationId}`, params)
    .then((r) => r.data);

/**
 * Update the organization's logo. This can only be called by an admin or owner.
 *
 * ```typescript
 * import {uploadOrganizationLogo} from '@verdocs/js-sdk';
 *
 * await uploadOrganizationLogo((VerdocsEndpoint.getDefault(), organizationId, file);
 * ```
 */
export const uploadOrganizationLogo = (
  endpoint: VerdocsEndpoint,
  organizationId: string,
  file: File,
  onUploadProgress?: (percent: number, loadedBytes: number, totalBytes: number) => void,
) => {
  const formData = new FormData();
  formData.append('logo', file, file.name);

  return endpoint.api //
    .patch<IProfile>(`/v2/organizations/${organizationId}`, formData, {
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
 * Update the organization's thumbnail. This can only be called by an admin or owner.
 *
 * ```typescript
 * import {uploadOrganizationThumbnail} from '@verdocs/js-sdk';
 *
 * await uploadOrganizationThumbnail((VerdocsEndpoint.getDefault(), organizationId, file);
 * ```
 */
export const uploadOrganizationThumbnail = (
  endpoint: VerdocsEndpoint,
  organizationId: string,
  file: File,
  onUploadProgress?: (percent: number, loadedBytes: number, totalBytes: number) => void,
) => {
  const formData = new FormData();
  formData.append('thumbnail', file, file.name);

  return endpoint.api //
    .patch<IProfile>(`/v2/organizations/${organizationId}`, formData, {
      timeout: 120000,
      onUploadProgress: (event) => {
        const total = event.total || 1;
        const loaded = event.loaded || 0;
        onUploadProgress?.(Math.floor((loaded * 100) / (total || 1)), loaded, total || 1);
      },
    })
    .then((r) => r.data);
};
