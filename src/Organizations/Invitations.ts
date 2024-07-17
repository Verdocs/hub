import {IAcceptOrganizationInvitationRequest, ICreateInvitationRequest} from './Types';
import type {IAuthenticateResponse} from '../Users';
import {VerdocsEndpoint} from '../VerdocsEndpoint';
import {IOrganizationInvitation} from '../Models';

/**
 * An invitation represents an opportunity for a Member to join an Organization.
 *
 * @module
 */

/**
 * Get a list of invitations pending for the caller's organization. The caller must be an admin or owner.
 */
export const getOrganizationInvitations = (endpoint: VerdocsEndpoint) =>
  endpoint.api //
    .get<IOrganizationInvitation[]>(`/v2/organization-invitations`)
    .then((r) => r.data);

/**
 * Invite a new user to join the organization.
 */
export const createOrganizationInvitation = (endpoint: VerdocsEndpoint, params: ICreateInvitationRequest) =>
  endpoint.api //
    .post<IOrganizationInvitation>(`/v2/organization-invitations`, params)
    .then((r) => r.data);

/**
 * Delete an invitation. Note that no cancellation message will be sent. Invitations are also one-time-use.
 * If the invitee attempts to join after the invitation is deleted, accepted, or decline, they will be
 * shown an error.
 */
export const deleteOrganizationInvitation = (endpoint: VerdocsEndpoint, email: string) =>
  endpoint.api //
    .delete(`/v2/organization-invitations/${email}`)
    .then((r) => r.data);

/**
 * Update an invitation. Note that email may not be changed after the invite is sent. To change
 * an invitee's email, delete the incorrect entry and create one with the correct value.
 */
export const updateOrganizationInvitation = (
  endpoint: VerdocsEndpoint,
  email: string,
  params: Pick<ICreateInvitationRequest, 'role' | 'first_name' | 'last_name'>,
) =>
  endpoint.api //
    .patch<IOrganizationInvitation>(`/v2/organization-invitations/${email}`, params)
    .then((r) => r.data);

/**
 * Send a reminder to the invitee to join the organization.
 */
export const resendOrganizationInvitation = (endpoint: VerdocsEndpoint, email: string) =>
  endpoint.api //
    .post('/v2/organization-invitations/resend', {email})
    .then((r) => r.data);

/**
 * Get an invitation's details. This is generally used as the first step of accepting the invite.
 * A successful response will indicate that the invite token is still valid, and include some
 * metadata for the organization to style the acceptance screen.
 */
export const getOrganizationInvitation = (endpoint: VerdocsEndpoint, email: string, token: string) =>
  endpoint.api //
    .get<IOrganizationInvitation>(`/v2/organization-invitations/${email}/${token}`)
    .then((r) => r.data);

/**
 * Accept an invitation. This will automatically create an Auth0 user for the caller as well as a profile
 * with the appropriate role as specified in the invite. The profile will be set as "current" for the caller,
 * and session tokens will be returned to access the new profile. The profile's email_verified flag will
 * also be set to true.
 */
export const acceptOrganizationInvitation = (endpoint: VerdocsEndpoint, params: IAcceptOrganizationInvitationRequest) =>
  endpoint.api //
    .post<IAuthenticateResponse>('/v2/organization-invitations/accept', params)
    .then((r) => r.data);

/**
 * Decline an invitation. This will mark the status "declined," providing a visual indication to the
 * organization's admins that the invite was declined, preventing further invites from being created
 * to the same email address, and also preventing the invitee from receiving reminders to join.
 */
export const declineOrganizationInvitation = (endpoint: VerdocsEndpoint, email: string, token: string) =>
  endpoint.api //
    .post<{status: 'OK'}>('/v2/organization-invitations/decline', {email, token})
    .then((r) => r.data);
