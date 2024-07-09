import {IOrganizationInvitation, IProfile} from '../Models';
import {VerdocsEndpoint} from '../VerdocsEndpoint';
import {ICreateInvitationRequest} from './Types';

/**
 * An invitation represents an opportunity for a Member to join an Organization.
 *
 * @module
 */

export const getOrganizationInvitations = (endpoint: VerdocsEndpoint) =>
  endpoint.api //
    .get<IOrganizationInvitation[]>(`/v2/organization-invitations`)
    .then((r) => r.data);

export const createOrganizationInvitation = (endpoint: VerdocsEndpoint, params: ICreateInvitationRequest) =>
  endpoint.api //
    .post<IOrganizationInvitation>(`/v2/organization-invitations`, params)
    .then((r) => r.data);

export const deleteOrganizationInvitation = (endpoint: VerdocsEndpoint, email: string) =>
  endpoint.api //
    .delete(`/v2/organization-invitations/${email}`)
    .then((r) => r.data);

export const updateOrganizationInvitation = (endpoint: VerdocsEndpoint, email: string, params: Partial<ICreateInvitationRequest>) =>
  endpoint.api //
    .patch<IOrganizationInvitation>(`/v2/organization-invitations/${email}`, params)
    .then((r) => r.data);

export const resendOrganizationInvitation = (endpoint: VerdocsEndpoint, email: string) =>
  endpoint.api //
    .post('/v2/organization-invitations/resend', {email})
    .then((r) => r.data);

export const acceptOrganizationInvitation = (endpoint: VerdocsEndpoint, email: string, token: string) =>
  endpoint.api //
    .post<IProfile>('/v2/organization-invitations/accept', {email, token})
    .then((r) => r.data);

export const declineOrganizationInvitation = (endpoint: VerdocsEndpoint, email: string, token: string) =>
  endpoint.api //
    .post<{status: 'OK'}>('/v2/organization-invitations/decline', {email, token})
    .then((r) => r.data);
