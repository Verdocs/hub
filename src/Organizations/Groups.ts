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
import {TPermission} from '../BaseTypes';
import {IGroup} from '../Models';

/**
 * Get a list of groups for a given organization. The caller must have admin access to the organization.
 *
 * ```typescript
 * import {getGroups} from '@verdocs/js-sdk';
 *
 * const groups = await getGroups(ORGID);
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
 * const groups = await getGroup(GROUPID);
 * ```
 */
export const getGroup = (endpoint: VerdocsEndpoint, groupId: string) =>
  endpoint.api //
    .get<IGroup>(`/v2/organization-groups/${groupId}`)
    .then((r) => r.data);

export const createGroup = (endpoint: VerdocsEndpoint, params: {name: string; permissions: TPermission[]}) =>
  endpoint.api //
    .post('/v2/organization-groups', params)
    .then((r) => r.data);

export const addGroupMember = (endpoint: VerdocsEndpoint, groupId: string, profile_id: string) =>
  endpoint.api //
    .post(`/v2/organization-groups/${groupId}/members`, {profile_id})
    .then((r) => r.data);

export const deleteGroupMember = (endpoint: VerdocsEndpoint, groupId: string, profile_id: string) =>
  endpoint.api //
    .delete(`/v2/organization-groups/${groupId}/members/${profile_id}`)
    .then((r) => r.data);

export const updateGroup = (endpoint: VerdocsEndpoint, groupId: string, params: {name: string; permissions: TPermission[]}) =>
  endpoint.api //
    .patch(`/v2/organization-groups/${groupId}`, params)
    .then((r) => r.data);
