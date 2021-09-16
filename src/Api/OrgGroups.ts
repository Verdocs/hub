import {Endpoint, StandardDataReponse} from './Endpoint';

export const getOrgGroups = (organizationId: string) =>
  Endpoint.get(`/organizations/${organizationId}/groups`).then(StandardDataReponse);

export const getOrgGroup = (organizationId: string, groupId: string) =>
  Endpoint.get(`/organizations/${organizationId}/groups/${groupId}`).then(StandardDataReponse);

export const getOrgGroupMembers = (organizationId: string, groupId: string) =>
  Endpoint.get(`/organizations/${organizationId}/groups/${groupId}/members`).then(StandardDataReponse);

export const addOrgGroupMembers = (organizationId: string, groupId: string, params: any) =>
  Endpoint.post(`/organizations/${organizationId}/groups/${groupId}/members`, params).then(StandardDataReponse);

export const deleteOrgGroupMembers = (organizationId: string, groupId: string, params: any) =>
  Endpoint.put(`/organizations/${organizationId}/groups/${groupId}/delete_members`, params).then(StandardDataReponse);

export const addOrgGroupPermission = (organizationId: string, groupId: string, permissionId: string, params: any) =>
  Endpoint.post(`/organizations/${organizationId}/groups/${groupId}/permissions/${permissionId}`, params).then(
    StandardDataReponse,
  );

export const deleteOrgGroupPermission = (organizationId: string, groupId: string, permissionId: string) =>
  Endpoint.delete(`/organizations/${organizationId}/groups/${groupId}/permissions/${permissionId}`).then(
    StandardDataReponse,
  );
