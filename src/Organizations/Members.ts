import {VerdocsEndpoint} from '../VerdocsEndpoint';
import {IProfile, IRole} from '../Users/Types';

/**
 * An Organization Member (aka Profile) is an individual user with access to an organization.
 *
 * @module
 */

export const getMembers = (endpoint: VerdocsEndpoint, organizationId: string) =>
  endpoint.api //
    .get<IProfile[]>(`/organizations/${organizationId}/profiles`)
    .then((r) => r.data);

export const deleteMember = (endpoint: VerdocsEndpoint, organizationId: string, profileId: string) =>
  endpoint.api //
    .delete(`/organizations/${organizationId}/profiles/${profileId}`)
    .then((r) => r.data);

export const addMemberRole = (endpoint: VerdocsEndpoint, organizationId: string, profileId: string, roleId: string) =>
  endpoint.api //
    .post<IRole>(`/organizations/${organizationId}/profiles/${profileId}/role/${roleId}`)
    .then((r) => r.data);

export const deleteMemberRole = (endpoint: VerdocsEndpoint, organizationId: string, profileId: string, roleId: string) =>
  endpoint.api //
    .delete(`/organizations/${organizationId}/profiles/${profileId}/role/${roleId}`)
    .then((r) => r.data);

export const getMemberPlans = (endpoint: VerdocsEndpoint, organizationId: string, profileId: string) =>
  endpoint.api //
    .get(`/organizations/${organizationId}/profiles/${profileId}/plans`)
    .then((r) => r.data);
