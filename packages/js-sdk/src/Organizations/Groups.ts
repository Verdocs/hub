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
 */
export const deleteGroupMember = (endpoint: VerdocsEndpoint, groupId: string, profile_id: string) =>
  endpoint.api //
    .delete(`/v2/organization-groups/${groupId}/members/${profile_id}`)
    .then((r) => r.data);
