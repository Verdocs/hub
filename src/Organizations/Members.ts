import {VerdocsEndpoint} from '../VerdocsEndpoint';
import {IProfile} from '../Models';

/**
 * An Organization Member (aka Profile) is an individual user with access to an organization.
 *
 * @module
 */

export const getOrganizationMembers = (endpoint: VerdocsEndpoint) =>
  endpoint.api //
    .get<IProfile[]>(`/v2/organization-members`)
    .then((r) => r.data);

export const deleteOrganizationMember = (endpoint: VerdocsEndpoint, profileId: string) =>
  endpoint.api //
    .delete(`/v2/organization-members/${profileId}`)
    .then((r) => r.data);

export const updateOrganizationMember = (endpoint: VerdocsEndpoint, profileId: string, params: Pick<IProfile, 'roles' | 'permissions'>) =>
  endpoint.api //
    .patch(`/v2/organization-members/${profileId}`, params)
    .then((r) => r.data);
