import {Endpoint, StandardDataReponse} from './Endpoint';

export const getOrgProfiles = (organizationId: string) =>
  Endpoint.get(`/organizations/${organizationId}/profiles`).then(StandardDataReponse);

export const deleteOrgProfile = (organizationId: string, profileId: string) =>
  Endpoint.delete(`/organizations/${organizationId}/profiles/${profileId}`).then(StandardDataReponse);

export const getOrgProfileRole = (organizationId: string, profileId: string, roleId: string) =>
  Endpoint.delete(`/organizations/${organizationId}/profiles/${profileId}/roles/${roleId}`).then(StandardDataReponse);

export const addOrgProfileRole = (organizationId: string, profileId: string, roleId: string) =>
  Endpoint.post(`/organizations/${organizationId}/profiles/${profileId}/roles/${roleId}`).then(StandardDataReponse);

export const getOrgPlans = (organizationId: string, profileId: string) =>
  Endpoint.get(`/organizations/${organizationId}/profiles/${profileId}/plans`).then(StandardDataReponse);
