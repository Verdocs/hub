import {VerdocsEndpoint} from '../VerdocsEndpoint';
import {IProfile} from '../Models';

/**
 * An Organization Member (aka Profile) is an individual user with access to an organization.
 *
 * @module
 */

/**
 * Get a list of the members in the caller's organization.
 *
 * ```typescript
 * import {getOrganizationMembers} from '@verdocs/js-sdk';
 *
 * const members = await deleteOrganizationMember(VerdocsEndpoint.getDefault()});
 * ```
 */
export const getOrganizationMembers = (endpoint: VerdocsEndpoint) =>
  endpoint.api //
    .get<IProfile[]>(`/v2/organization-members`)
    .then((r) => r.data);

/**
 * Delete a member from the caller's organization. Note that the caller must be an admin or owner,
 * may not delete him/herself.
 *
 * ```typescript
 * import {deleteOrganizationMember} from '@verdocs/js-sdk';
 *
 * await deleteOrganizationMember(VerdocsEndpoint.getDefault(), 'PROFILEID'});
 * ```
 */
export const deleteOrganizationMember = (endpoint: VerdocsEndpoint, profileId: string) =>
  endpoint.api //
    .delete(`/v2/organization-members/${profileId}`)
    .then((r) => r.data);

/**
 * Update a member.
 *
 * ```typescript
 * import {updateOrganizationMember} from '@verdocs/js-sdk';
 *
 * const result = await updateOrganizationMember(VerdocsEndpoint.getDefault(), 'PROFILEID', {roles:['member']});
 * ```
 */
export const updateOrganizationMember = (
  endpoint: VerdocsEndpoint,
  profileId: string,
  params: Pick<IProfile, 'roles' | 'first_name' | 'last_name'>,
) =>
  endpoint.api //
    .patch(`/v2/organization-members/${profileId}`, params)
    .then((r) => r.data);
