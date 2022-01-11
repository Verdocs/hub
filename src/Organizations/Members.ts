/**
 * An Organization Member (aka Profile) is an individual user with access to an organization.
 *
 * @module
 */

import {getEndpoint} from '../HTTP/Transport';

export const getMembers = (organizationId: string) =>
  getEndpoint()
    .api.get(`/organizations/${organizationId}/profiles`)
    .then((r) => r.data);

export const deleteMember = (organizationId: string, profileId: string) =>
  getEndpoint()
    .api.delete(`/organizations/${organizationId}/profiles/${profileId}`)
    .then((r) => r.data);

export const addMemberRole = (organizationId: string, profileId: string, roleId: string) =>
  getEndpoint()
    .api.post(`/organizations/${organizationId}/profiles/${profileId}/roles/${roleId}`)
    .then((r) => r.data);

export const deleteMemberRole = (organizationId: string, profileId: string, roleId: string) =>
  getEndpoint()
    .api.delete(`/organizations/${organizationId}/profiles/${profileId}/roles/${roleId}`)
    .then((r) => r.data);

export const getMemberPlans = (organizationId: string, profileId: string) =>
  getEndpoint()
    .api.get(`/organizations/${organizationId}/profiles/${profileId}/plans`)
    .then((r) => r.data);
