/**
 * Organizations may contain "Groups" of user profiles, called Members. Groups may have permissions assigned that
 * apply to all Members, making it easy to configure role-based access control (RBAC) within an Organization. Note
 * that permissions are **additive**. A user may be a member of more than one group, and may also have permissions
 * assigned directly. In that case, the user will have the combined set of all permissions inherited from all
 * sources.
 *
 * @module
 */

import {VerdocsEndpoint} from '../VerdocsEndpoint';
import {TPermission} from '../Sessions';
import {IGroup} from '../Models';

/**
 * Get a list of groups for the caller's organization. NOTE: Any organization member may request
 * the list of groups, but only Owners and Admins may update them.
 *
 * ```typescript
 * import {getGroups} from '@verdocs/js-sdk';
 *
 * const groups = await getGroups();
 * ```
 *
 * @group Organization Groups
 * @api GET /v2/organization-groups List organization groups
 * @apiSuccess array(items: IGroup) . The caller's organization groups
 *
 * @sdkOperation group.getGroups
 * @sdkGroup Group
 * @sdkPage Endpoints
 */
export const getGroups = (endpoint: VerdocsEndpoint) =>
  endpoint.api //
    .get<IGroup[]>(`/v2/organization-groups`)
    .then((r) => r.data);

/**
 * Get the details for a group, including its member profiles and list of permissions.
 *
 * ```typescript
 * import {getGroup} from '@verdocs/js-sdk/v2/organization-groups';
 *
 * const group = await getGroup(GROUPID);
 * ```
 *
 * @group Organization Groups
 * @api GET /v2/organization-groups/:group_id Get organization group
 * @apiParam string(format:uuid) group_id The group ID to retrieve.
 * @apiSuccess IGroup . The requested group, including members and permissions
 *
 * @sdkOperation group.getGroup
 * @sdkGroup Group
 * @sdkPage Endpoints
 */
export const getGroup = (endpoint: VerdocsEndpoint, groupId: string) =>
  endpoint.api //
    .get<IGroup>(`/v2/organization-groups/${groupId}`)
    .then((r) => r.data);

/**
 * Create a group. Note that "everyone" is a reserved name and may not be created.
 *
 * ```typescript
 * import {createGroup} from '@verdocs/js-sdk';
 *
 * const group = await createGroup(VerdocsEndpoint.getDefault(), {name:'newgroup'});
 * ```
 *
 * @group Organization Groups
 * @api POST /v2/organization-groups Create organization group
 * @apiBody string name Name for the new group. "everyone" is reserved and may not be used.
 * @apiBody array(items:TPermission) permissions Permissions to assign to the group
 * @apiSuccess IGroup . The newly-created group
 *
 * @sdkOperation group.createGroup
 * @sdkGroup Group
 * @sdkPage Endpoints
 */
export const createGroup = (endpoint: VerdocsEndpoint, params: {name: string; permissions: TPermission[]}) =>
  endpoint.api //
    .post('/v2/organization-groups', params)
    .then((r) => r.data);

/**
 * Update a group. Note that "everyone" is a reserved name and may not be changed.
 *
 * ```typescript
 * import {updateGroup} from '@verdocs/js-sdk';
 *
 * const updated = await updateGroup(VerdocsEndpoint.getDefault(), {name:'newname'});
 * ```
 *
 * @group Organization Groups
 * @api PATCH /v2/organization-groups/:group_id Update organization group
 * @apiParam string(format:uuid) group_id The group ID to update.
 * @apiBody string name? New name for the group. "everyone" is reserved and may not be changed.
 * @apiBody array(items:TPermission) permissions? Updated permissions for the group
 * @apiSuccess IGroup . The updated group
 *
 * @sdkOperation group.updateGroup
 * @sdkGroup Group
 * @sdkPage Endpoints
 */
export const updateGroup = (endpoint: VerdocsEndpoint, groupId: string, params: {name: string; permissions: TPermission[]}) =>
  endpoint.api //
    .patch(`/v2/organization-groups/${groupId}`, params)
    .then((r) => r.data);

/**
 * Get an organization by ID. Note that the "everyone" group cannot be deleted.
 *
 * ```typescript
 * import {deleteGroup} from '@verdocs/js-sdk';
 *
 * await deleteGroup(VerdocsEndpoint.getDefault(), 'ORGID');
 * ```
 *
 * @group Organization Groups
 * @api DELETE /v2/organization-groups/:group_id Delete organization group
 * @apiParam string(format:uuid) group_id The group ID to delete. The "everyone" group cannot be deleted.
 * @apiSuccess string . Success
 *
 * @sdkOperation group.deleteGroup
 * @sdkGroup Group
 * @sdkPage Endpoints
 */
export const deleteGroup = (endpoint: VerdocsEndpoint, groupId: string) =>
  endpoint.api //
    .delete(`/v2/organization-groups/${groupId}`)
    .then((r) => r.data);

/**
 * Add a member to a group.
 *
 * ```typescript
 * import {addGroupMember} from '@verdocs/js-sdk';
 *
 * await addGroupMember(VerdocsEndpoint.getDefault(), 'GROUPID', 'PROFILEID');
 * ```
 *
 * @group Organization Groups
 * @api POST /v2/organization-groups/:group_id/members Add member to organization group
 * @apiParam string(format:uuid) group_id The group ID to update.
 * @apiBody string(format:uuid) profile_id Profile ID to add to the group
 * @apiSuccess IGroup . The updated group
 *
 * @sdkOperation group.addGroupMember
 * @sdkGroup Group
 * @sdkPage Endpoints
 */
export const addGroupMember = (endpoint: VerdocsEndpoint, groupId: string, profile_id: string) =>
  endpoint.api //
    .post(`/v2/organization-groups/${groupId}/members`, {profile_id})
    .then((r) => r.data);

/**
 * Remove a member from a group.
 *
 * ```typescript
 * import {deleteGroupMember} from '@verdocs/js-sdk';
 *
 * await deleteGroupMember(VerdocsEndpoint.getDefault(), 'GROUPID', 'PROFILEID');
 * ```
 *
 * @group Organization Groups
 * @api DELETE /v2/organization-groups/:group_id/members/:profile_id Remove member from organization group
 * @apiParam string(format:uuid) group_id The group ID to update.
 * @apiParam string(format:uuid) profile_id Profile ID to remove from the group
 * @apiSuccess IGroup . The updated group
 *
 * @sdkOperation group.deleteGroupMember
 * @sdkGroup Group
 * @sdkPage Endpoints
 */
export const deleteGroupMember = (endpoint: VerdocsEndpoint, groupId: string, profile_id: string) =>
  endpoint.api //
    .delete(`/v2/organization-groups/${groupId}/members/${profile_id}`)
    .then((r) => r.data);
