import {Endpoint} from '../HTTP/Transport';

export const getGroups = (organizationId: string) =>
  Endpoint.get(`/organizations/${organizationId}/groups`).then((r) => r.data);

export const getGroup = (organizationId: string, groupId: string) =>
  Endpoint.get(`/organizations/${organizationId}/groups/${groupId}`).then((r) => r.data);

export const getGroupMembers = (organizationId: string, groupId: string) =>
  Endpoint.get(`/organizations/${organizationId}/groups/${groupId}/members`).then((r) => r.data);

export const addGroupMembers = (organizationId: string, groupId: string, params: any) =>
  Endpoint.post(`/organizations/${organizationId}/groups/${groupId}/members`, params).then((r) => r.data);

export const deleteGroupMembers = (organizationId: string, groupId: string, params: any) =>
  Endpoint.put(`/organizations/${organizationId}/groups/${groupId}/delete_members`, params).then((r) => r.data);

export const addGroupPermission = (organizationId: string, groupId: string, permissionId: string, params: any) =>
  Endpoint.post(`/organizations/${organizationId}/groups/${groupId}/permissions/${permissionId}`, params).then(
    (r) => r.data,
  );

export const deleteGroupPermission = (organizationId: string, groupId: string, permissionId: string) =>
  Endpoint.delete(`/organizations/${organizationId}/groups/${groupId}/permissions/${permissionId}`).then((r) => r.data);
