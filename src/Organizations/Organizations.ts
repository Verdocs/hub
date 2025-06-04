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

import {IEntitlement, IOrganization, IProfile, TOrganizationUsage} from '../Models';
import {VerdocsEndpoint} from '../VerdocsEndpoint';
import {IAuthenticateResponse} from '../Users';
import {collapseEntitlements} from '../Utils';
import {TUsageType} from '../BaseTypes';

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
 * Get an organization's "children".
 *
 * ```typescript
 * import {getOrganizationChildren} from '@verdocs/js-sdk';
 *
 * const children = await getOrganizationChildren(VerdocsEndpoint.getDefault(), 'ORGID');
 * ```
 *
 * @group Organizations
 * @api GET /v2/organizations/:organization_id/children Get an organization's children
 * @apiSuccess IOrganization[] . Any child organizations found.
 */
export const getOrganizationChildren = (endpoint: VerdocsEndpoint, organizationId: string) =>
  endpoint.api //
    .get<IOrganization>(`/v2/organizations/${organizationId}/children`)
    .then((r) => r.data);

/**
 * Get an organization's usage data. If the organization is a parent, usage data for children
 * will be included as well. The response will be a nested object keyed by organization ID,
 * with each entry being a dictionary of usageType:count entries.
 *
 * ```typescript
 * import {getOrganizationUsage} from '@verdocs/js-sdk';
 *
 * const usage = await getOrganizationUsage(VerdocsEndpoint.getDefault(), 'ORGID');
 * ```
 *
 * @group Organizations
 * @api GET /v2/organizations/:organization_id/usage Get an organization's usage metrics
 * @apiSuccess TOrganizationUsage . Usage data grouped by organization ID
 */
export const getOrganizationUsage = (
  endpoint: VerdocsEndpoint,
  organizationId: string,
  params?: {start_date?: string; end_date?: string; usage_type?: TUsageType},
) =>
  endpoint.api //
    .get<TOrganizationUsage>(`/v2/organizations/${organizationId}/usage`, {params})
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
 * @apiBody string parent_id? If set, the new organization will be created as a child of the specified parent organization. The caller must be an admin of the parent organization.
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
  params: {name: string} & Partial<
    Pick<
      IOrganization,
      | 'address'
      | 'address2'
      | 'phone'
      | 'contact_email'
      | 'url'
      | 'full_logo_url'
      | 'thumbnail_url'
      | 'primary_color'
      | 'secondary_color'
      | 'parent_id'
    >
  >,
) =>
  endpoint.api //
    .post<IAuthenticateResponse & {profile: IProfile; organization: IOrganization}>(`/v2/organizations`, params)
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

export const getEntitlements = async (endpoint: VerdocsEndpoint) =>
  endpoint.api.get<IEntitlement[]>(`/v2/organizations/entitlements`).then((r) => r.data);

/**
 * Largely intended to be used internally by Web SDK components but may be informative for other cases.
 * Entitlements are feature grants such as "ID-based KBA" that require paid contracts to enable, typically
 * because the underlying services that support them are fee-based. Entitlements may run concurrently,
 * and may have different start/end dates e.g. "ID-based KBA" may run 1/1/2026-12/31/2026 while
 * "SMS Authentication" may be added later and run 6/1/2026-5/31/2027. The entitlements list is a simple
 * array of enablements and may include entries that are not YET enabled or have now expired.
 *
 * In client code it is helpful to simply know "is XYZ feature currently enabled?" This function collapses
 * the entitlements list to a simplified dictionary of current/active entitlements. Note that it is async
 * because it calls the server to obtain the "most current" entitlements list. Existence of an entry in the
 * resulting dictionary implies the feature is active. Metadata inside each entry can be used to determine
 * limits, etc.
 *
 * ```typescript
 * import {getActiveEntitlements} from '@verdocs/js-sdk';
 *
 * const activeEntitlements = await getActiveEntitlements((VerdocsEndpoint.getDefault());
 * const isSMSEnabled = !!activeEntitlements.sms_auth;
 * const monthlyKBALimit = activeEntitlements.kba_auth?.monthly_max;
 * ```
 */
export const getActiveEntitlements = async (endpoint: VerdocsEndpoint) => {
  if (!endpoint.session) {
    throw new Error('No active session');
  }

  const entitlements = await getEntitlements(endpoint);
  return collapseEntitlements(entitlements);
};
