import {IOrganizationInvitation, IProfile} from '../Models';
import {VerdocsEndpoint} from '../VerdocsEndpoint';
import {ICreateInvitationRequest} from './Types';

/**
 * An invitation represents an opportunity for a Member to join an Organization.
 *
 * @module
 */

export const getOrganizationInvitations = (endpoint: VerdocsEndpoint, organizationId: string) =>
  endpoint.api //
    .get<IOrganizationInvitation[]>(`/organizations/${organizationId}/invitation`)
    .then((r) => r.data);

export const createOrganizationInvitation = (endpoint: VerdocsEndpoint, organizationId: string, params: ICreateInvitationRequest) =>
  endpoint.api //
    .post<IOrganizationInvitation>(`/organizations/${organizationId}/invitation`, params)
    .then((r) => r.data);

export const deleteOrganizationInvitation = (endpoint: VerdocsEndpoint, organizationId: string, email: string) =>
  endpoint.api //
    .delete(`/organizations/${organizationId}/invitation/${email}`)
    .then((r) => r.data);

export const updateOrganizationInvitation = (
  endpoint: VerdocsEndpoint,
  organizationId: string,
  email: string,
  params: Partial<ICreateInvitationRequest>,
) =>
  endpoint.api //
    .patch<IOrganizationInvitation>(`/organizations/${organizationId}/invitation/${email}`, params)
    .then((r) => r.data);

export const resendOrganizationInvitation = (endpoint: VerdocsEndpoint, organizationId: string, email: string) =>
  endpoint.api //
    .post(`/organizations/${organizationId}/invitation/${email}/resend`)
    .then((r) => r.data);

export const getOrganizationInvitation = (endpoint: VerdocsEndpoint, organizationId: string, email: string, token: string) =>
  endpoint.api //
    .get<IOrganizationInvitation>(`/organizations/${organizationId}/invitation/${email}/accept/${token}`)
    .then((r) => r.data);

export const acceptOrganizationInvitation = (endpoint: VerdocsEndpoint, organizationId: string, email: string, token: string) =>
  endpoint.api //
    .post<IProfile>(`/organizations/${organizationId}/invitation/${email}/accept/${token}`)
    .then((r) => r.data);

export const declineOrganizationInvitation = (endpoint: VerdocsEndpoint, organizationId: string, email: string, token: string) =>
  endpoint.api //
    .post<{status: 'OK'}>(`/organizations/${organizationId}/invitation/${email}/decline/${token}`)
    .then((r) => r.data);

export const claimNewUser = (endpoint: VerdocsEndpoint, organizationId: string, email: string, token: string) =>
  endpoint.api //
    .put(`/organizations/${organizationId}/invitation/${email}/token/${token}/new_user`)
    .then((r) => r.data);
