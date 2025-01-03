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

import {IOrganization} from '../Models';
import {IAuthenticateResponse} from '../Users';
import {VerdocsEndpoint} from '../VerdocsEndpoint';

/**
 * Get an organization by ID. Note that this endpoint will return only a subset of fields
 * if the caller is not a member of the organization (the public fields).
 *
 * ```typescript
 * import {getOrganization} from '@verdocs/js-sdk';
 *
 * const organizations = await getOrganization(VerdocsEndpoint.getDefault(), 'ORGID');
 * ```
 *
 * @group Organizations
 * @api GET /v2/organizations/:organization_id Get organization
 * @apiSuccess IOrganization . The requested organization. The caller must be a member.
 */
export const getOrganization = (endpoint: VerdocsEndpoint, organizationId: string) =>
  endpoint.api //
    .get<IOrganization>(`/v2/organizations/${organizationId}`)
    .then((r) => r.data);

/**
 * Create an organization. The caller will be assigned an "Owner" profile in the new organization,
 * and it will be set to "current" automatically. A new set of session tokens will be issued to
 * the caller, and the caller should update their endpoint to use the new tokens.
 *
 * ```typescript
 * import {createOrganization} from '@verdocs/js-sdk';
 *
 * const organization = await createOrganization(VerdocsEndpoint.getDefault(), {name: 'NewOrg'});
 * ```
 *
 * @group Organizations
 * @api POST /v2/organizations Create organization
 * @apiDescription The caller will be assigned an "Owner" profile in the new organization, and it will be set to "current" automatically. A new set of session tokens will be issued to  the caller, and the caller should update their endpoint to use the new tokens.
 * @apiBody string name The name of the new organization
 * @apiBody string contact_email? Contact email for the new organization
 * @apiBody string url? URL for the new organization
 * @apiBody string full_logo_url? URL of a large-format PNG logo
 * @apiBody string thumbnail_url? URL of a small-format (square is recommended) PNG logo
 * @apiBody string primary_color? URL of a small-format (square is recommended) PNG logo
 * @apiBody string secondary_color? URL of a small-format (square is recommended) PNG logo
 * @apiSuccess IAuthenticateResponse . Authentication credentials for user in the new organization. The user will be made an Owner automatically.
 */
export const createOrganization = (
  endpoint: VerdocsEndpoint,
  params: Pick<
    IOrganization,
    | 'name'
    | 'address'
    | 'address2'
    | 'phone'
    | 'contact_email'
    | 'url'
    | 'full_logo_url'
    | 'thumbnail_url'
    | 'primary_color'
    | 'secondary_color'
  >,
) =>
  endpoint.api //
    .post<IAuthenticateResponse>(`/v2/organizations`, params)
    .then((r) => r.data);

/**
 * Update an organization. This can only be called by an admin or owner.
 *
 * ```typescript
 * import {updateOrganization} from '@verdocs/js-sdk';
 *
 * const organizations = await updateOrganization(VerdocsEndpoint.getDefault(), organizationId, {name:'ORGNAME'});
 * ```
 *
 * @group Organizations
 * @api PATCH /v2/organizations/:organization_id Update organization
 * @apiBody string name The name of the new organization
 * @apiBody string contact_email? Contact email for the new organization
 * @apiBody string url? URL for the new organization
 * @apiBody string full_logo_url? URL of a large-format PNG logo
 * @apiBody string thumbnail_url? URL of a small-format (square is recommended) PNG logo
 * @apiBody string primary_color? URL of a small-format (square is recommended) PNG logo
 * @apiBody string secondary_color? URL of a small-format (square is recommended) PNG logo
 * @apiSuccess IOrganization . The details for the updated organization
 */
export const updateOrganization = (endpoint: VerdocsEndpoint, organizationId: string, params: Partial<IOrganization>) =>
  endpoint.api //
    .patch<IOrganization>(`/v2/organizations/${organizationId}`, params)
    .then((r) => r.data);

/**
 * Delete an organization. This can only be called by an owner. Inclusion of the organization ID to delete
 * is just a safety check. The caller may only delete the organization they have currently selected.
 *
 * ```typescript
 * import {deleteOrganization} from '@verdocs/js-sdk';
 *
 * const newSession = await deleteOrganization(VerdocsEndpoint.getDefault(), organizationId);
 * ```
 *
 * @group Organizations
 * @api DELETE /v2/organizations/:organization_id Delete organization
 * @apiSuccess IAuthenticateResponse . If the caller is a member of another organization, authentication credentials for the next organization available. If not, this will be null and the caller will be logged out.
 */
export const deleteOrganization = (endpoint: VerdocsEndpoint, organizationId: string) =>
  endpoint.api //
    .delete<IAuthenticateResponse | null>(`/v2/organizations/${organizationId}`)
    .then((r) => r.data);

/**
 * Update the organization's full or thumbnail logo. This can only be called by an admin or owner.
 *
 * ```typescript
 * import {updateOrganizationLogo} from '@verdocs/js-sdk';
 *
 * await updateOrganizationLogo((VerdocsEndpoint.getDefault(), organizationId, file);
 * ```
 *
 * @group Organizations
 * @api PATCH /v2/organizations/:organization_id Update organization full or thumbnail logo.
 * @apiBody image/png logo? Form-url-encoded file to upload
 * @apiBody image/png thumbnail? Form-url-encoded file to upload
 * @apiSuccess IOrganization . The updated organization.
 */
export const updateOrganizationLogo = (
  endpoint: VerdocsEndpoint,
  organizationId: string,
  file: File,
  onUploadProgress?: (percent: number, loadedBytes: number, totalBytes: number) => void,
) => {
  const formData = new FormData();
  formData.append('logo', file, file.name);

  return endpoint.api //
    .patch<IOrganization>(`/v2/organizations/${organizationId}`, formData, {
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
 * import {updateOrganizationThumbnail} from '@verdocs/js-sdk';
 *
 * await updateOrganizationThumbnail((VerdocsEndpoint.getDefault(), organizationId, file);
 * ```
 */
export const updateOrganizationThumbnail = (
  endpoint: VerdocsEndpoint,
  organizationId: string,
  file: File,
  onUploadProgress?: (percent: number, loadedBytes: number, totalBytes: number) => void,
) => {
  const formData = new FormData();
  formData.append('thumbnail', file, file.name);

  return endpoint.api //
    .patch<IOrganization>(`/v2/organizations/${organizationId}`, formData, {
      timeout: 120000,
      onUploadProgress: (event) => {
        const total = event.total || 1;
        const loaded = event.loaded || 0;
        onUploadProgress?.(Math.floor((loaded * 100) / (total || 1)), loaded, total || 1);
      },
    })
    .then((r) => r.data);
};
