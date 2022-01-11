/**
 * Organizations may contain "Groups" of user profiles, called Members. Groups may have permissions assigned that
 * apply to all Members, making it easy to configure role-based access control (RBAC) within an Organization. Note
 * that permissions are **additive**. A user may be a member of more than one group, and may also have permissions
 * assigned directly. In that case, the user will have the combined set of all permissions inherited from all
 * sources.
 *
 * @module
 */

import {getEndpoint} from '../HTTP/Transport';
import {IGroup, IGroupDetail} from './Types';

/**
 * Get a list of groups for a given organization. The caller must have admin access to the organization.
 *
 * ```typescript
 * import {Groups} from '@verdocs/js-sdk/Organizations';
 *
 * const groups = await Groups.getGroups(ORGID);
 * ```
 */
export const getGroups = (organizationId: string) =>
  getEndpoint()
    .api.get<IGroup[]>(`/organizations/${organizationId}/groups`)
    .then((r) => r.data);

/**
 * Get the details for a group.
 *
 * ```typescript
 * import {Groups} from '@verdocs/js-sdk/Organizations';
 *
 * const groups = await Groups.getGroups(ORGID);
 * ```
 */
export const getGroup = (organizationId: string, groupId: string) =>
  getEndpoint()
    .api.get<IGroupDetail>(`/organizations/${organizationId}/groups/${groupId}`)
    .then((r) => r.data);

export const getMembers = (organizationId: string, groupId: string) =>
  getEndpoint()
    .api.get(`/organizations/${organizationId}/groups/${groupId}/members`)
    .then((r) => r.data);

export const addMembers = (organizationId: string, groupId: string, params: any) =>
  getEndpoint()
    .api.post(`/organizations/${organizationId}/groups/${groupId}/members`, params)
    .then((r) => r.data);

export const deleteMembers = (organizationId: string, groupId: string, params: any) =>
  getEndpoint()
    .api.put(`/organizations/${organizationId}/groups/${groupId}/delete_members`, params)
    .then((r) => r.data);

export const addPermission = (organizationId: string, groupId: string, permissionId: string, params: any) =>
  getEndpoint()
    .api.post(`/organizations/${organizationId}/groups/${groupId}/permissions/${permissionId}`, params)
    .then((r) => r.data);

export const deletePermission = (organizationId: string, groupId: string, permissionId: string) =>
  getEndpoint()
    .api.delete(`/organizations/${organizationId}/groups/${groupId}/permissions/${permissionId}`)
    .then((r) => r.data);
