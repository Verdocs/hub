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
 * const members = await getOrganizationMembers(VerdocsEndpoint.getDefault()});
 * ```
 *
 * @group Organization Members
 * @api GET /v2/organization-members List current organization's members
 * @apiSuccess array(items:IProfile) . List of caller's current organization's members
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
 *
 * @group Organization Members
 * @apiParam string(format:uuid) profile_id The Profile ID to remove.
 * @api DELETE /v2/organization-members/:profile_id Delete a member from the organization
 * @apiSuccess string . Success
 */
export const deleteOrganizationMember = (endpoint: VerdocsEndpoint, profileId: string) =>
  endpoint.api //
    .delete(`/v2/organization-members/${profileId}`)
    .then((r) => r.data);

/**
 * Update an organization member.
 *
 * ```typescript
 * import {updateOrganizationMember} from '@verdocs/js-sdk';
 *
 * const result = await updateOrganizationMember(VerdocsEndpoint.getDefault(), 'PROFILEID', {roles:['member']});
 * ```
 *
 * @group Organization Members
 * @api PATCH /v2/organization-members/:profile_id Update an organization member.
 * @apiParam string(format:uuid) profile_id The Profile ID to update.
 * @apiBody string first_name? First name for the member
 * @apiBody string last_name? Last name for the member
 * @apiBody array(items:TRole) roles? Roles (e.g. "member" or "admin") to assign to the user.
 * @apiSuccess IProfile . The updated profile for the member.
 */
export const updateOrganizationMember = (
  endpoint: VerdocsEndpoint,
  profileId: string,
  params: Partial<Pick<IProfile, 'roles' | 'first_name' | 'last_name'>>,
) =>
  endpoint.api //
    .patch<IProfile>(`/v2/organization-members/${profileId}`, params)
    .then((r) => r.data);

/**
 * Lock an organization member's account. The member will be unable to sign in until an admin
 * unlocks them or they complete the password-reset flow. Caller must be an admin or owner,
 * may not lock him/herself, and the target must have a linked user account.
 *
 * ```typescript
 * import {lockOrganizationMember} from '@verdocs/js-sdk';
 *
 * const result = await lockOrganizationMember(VerdocsEndpoint.getDefault(), 'PROFILEID', 'Departed employee');
 * ```
 *
 * @group Organization Members
 * @api PUT /v2/organization-members/:profile_id Perform an operation on an organization member.
 * @apiParam string(format:uuid) profile_id The Profile ID to operate on.
 * @apiBody string(enum:'lock') action Action to perform
 * @apiBody string reason Reason the account is being locked. Stored on the user record and shown to admins.
 * @apiSuccess IProfile . The updated profile for the member, with the joined user record.
 */
export const lockOrganizationMember = (endpoint: VerdocsEndpoint, profileId: string, reason: string) =>
  endpoint.api //
    .put<IProfile>(`/v2/organization-members/${profileId}`, {action: 'lock', reason})
    .then((r) => r.data);

/**
 * Unlock a member whose account has been locked (typically after too many failed sign-in attempts
 * or via an earlier admin lock). Caller must be an admin or owner, may not unlock him/herself, and
 * the target must have a linked user account. Clears `locked`, `lock_reason`, and `login_failures`.
 *
 * ```typescript
 * import {unlockOrganizationMember} from '@verdocs/js-sdk';
 *
 * const result = await unlockOrganizationMember(VerdocsEndpoint.getDefault(), 'PROFILEID');
 * ```
 *
 * @group Organization Members
 * @api PUT /v2/organization-members/:profile_id Perform an operation on an organization member.
 * @apiParam string(format:uuid) profile_id The Profile ID to operate on.
 * @apiBody string(enum:'unlock') action Action to perform
 * @apiSuccess IProfile . The updated profile for the member, with the joined user record.
 */
export const unlockOrganizationMember = (endpoint: VerdocsEndpoint, profileId: string) =>
  endpoint.api //
    .put<IProfile>(`/v2/organization-members/${profileId}`, {action: 'unlock'})
    .then((r) => r.data);
