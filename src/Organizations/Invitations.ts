import {VerdocsEndpoint} from '../VerdocsEndpoint';
import {IInvitation} from './Types';
import {IProfile} from '../Users/Types';

/**
 * An invitation represents an opportunity for a Member to join an Organization.
 *
 * @module
 */

export interface ICreateInvitationRequest {
  email: string;
  role_id: string;
  organization_id: string;
}

export const getInvitations = (endpoint: VerdocsEndpoint, organizationId: string) =>
  endpoint.api //
    .get<IInvitation[]>(`/organizations/${organizationId}/invitation`)
    .then((r) => r.data);

export const createInvitation = (endpoint: VerdocsEndpoint, organizationId: string, params: ICreateInvitationRequest) =>
  endpoint.api //
    .post<IInvitation>(`/organizations/${organizationId}/invitation`, params)
    .then((r) => r.data);

export const deleteInvitation = (endpoint: VerdocsEndpoint, organizationId: string, email: string) =>
  endpoint.api //
    .delete(`/organizations/${organizationId}/invitation/${email}`)
    .then((r) => r.data);

export const updateInvitation = (
  endpoint: VerdocsEndpoint,
  organizationId: string,
  email: string,
  params: Partial<ICreateInvitationRequest>,
) =>
  endpoint.api //
    .patch<IInvitation>(`/organizations/${organizationId}/invitation/${email}`, params)
    .then((r) => r.data);

export const resendInvitation = (endpoint: VerdocsEndpoint, organizationId: string, email: string) =>
  endpoint.api //
    .post(`/organizations/${organizationId}/invitation/${email}/resend`)
    .then((r) => r.data);

export const acceptInvitation = (endpoint: VerdocsEndpoint, organizationId: string, email: string, token: string) =>
  endpoint.api //
    .post<IProfile>(`/organizations/${organizationId}/invitation/${email}/accept/${token}`)
    .then((r) => r.data);

export const declineInvitation = (endpoint: VerdocsEndpoint, organizationId: string, email: string, token: string) =>
  endpoint.api //
    .post<{status: 'OK'}>(`/organizations/${organizationId}/invitation/${email}/decline/${token}`)
    .then((r) => r.data);

export const claimNewUser = (endpoint: VerdocsEndpoint, organizationId: string, email: string, token: string) =>
  endpoint.api //
    .put(`/organizations/${organizationId}/invitation/${email}/token/${token}/new_user`)
    .then((r) => r.data);
