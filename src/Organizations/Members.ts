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
 * @api DELETE /v2/organization-members/:profile_id Delete a member from the organization
 * @apiSuccess string . Success
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
 *
 * @group Organization Members
 * @api PATCH /v2/organization-members/:profile_id Update an organization member.
 * @apiBody array(items:TRole) roles URL to send Webhook events to. An empty or invalid URL will disable Webhook calls.
 * @apiBody string first_name Set to true to enable Webhooks calls.
 * @apiBody string last_name Record<TWebhookEvent, boolean> map of events to enable/disable.
 * @apiSuccess array(items:IProfile) . List of caller's current organization's members
 */
export const updateOrganizationMember = (
  endpoint: VerdocsEndpoint,
  profileId: string,
  params: Pick<IProfile, 'roles' | 'first_name' | 'last_name'>,
) =>
  endpoint.api //
    .patch(`/v2/organization-members/${profileId}`, params)
    .then((r) => r.data);
