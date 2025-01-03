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
 *
 * @group Organization Invitations
 * @api GET /v2/organization-invitations Get a list of pending invitations
 * @apiBody array(items:TRole) roles URL to send Webhook events to. An empty or invalid URL will disable Webhook calls.
 * @apiBody string first_name First name. The user may override this after accepting the invitation.
 * @apiBody string last_name Last name. The user may override this after accepting the invitation.
 * @apiSuccess array(items:IProfile) . List of caller's current organization's members
 */
export const getOrganizationInvitations = (endpoint: VerdocsEndpoint) =>
  endpoint.api //
    .get<IOrganizationInvitation[]>(`/v2/organization-invitations`)
    .then((r) => r.data);

/**
 * Invite a new user to join the organization.
 *
 * @group Organization Invitations
 * @api POST /v2/organization-invitations Invite a new user to join the organization
 * @apiBody string email Email address to send the invitation to
 * @apiBody string first_name First name. The user may override this after accepting the invitation.
 * @apiBody string last_name Last name. The user may override this after accepting the invitation.
 * @apiBody TRole role Initial role to assign to the user once they accept.
 * @apiSuccess IOrganizationInvitation . The newly-created invitation.
 */
export const createOrganizationInvitation = (endpoint: VerdocsEndpoint, params: ICreateInvitationRequest) =>
  endpoint.api //
    .post<IOrganizationInvitation>(`/v2/organization-invitations`, params)
    .then((r) => r.data);

/**
 * Delete an invitation. Note that no cancellation message will be sent. Invitations are also one-time-use.
 * If the invitee attempts to join after the invitation is deleted, accepted, or decline, they will be
 * shown an error.
 *
 * @group Organization Invitations
 * @api DELETE /v2/organization-invitations/:email Delete a pending invitation
 * @apiSuccess string . Success
 */
export const deleteOrganizationInvitation = (endpoint: VerdocsEndpoint, email: string) =>
  endpoint.api //
    .delete(`/v2/organization-invitations/${email}`)
    .then((r) => r.data);

/**
 * Update an invitation. Note that email may not be changed after the invite is sent. To change
 * an invitee's email, delete the incorrect entry and create one with the correct value.
 *
 * @group Organization Invitations
 * @api PATCH /v2/organization-invitations/:email Update a pending invitation
 * @apiBody string first_name First name. The user may override this after accepting the invitation.
 * @apiBody string last_name Last name. The user may override this after accepting the invitation.
 * @apiBody TRole role Initial role to assign to the user once they accept.
 * @apiSuccess IOrganizationInvitation . The updated invitation.
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
 *
 * @group Organization Invitations
 * @api POST /v2/organization-invitations/resend Send a reminder to a pending invitee
 * @apiBody string email The recipient to send the reminder to
 * @apiSuccess IOrganizationInvitation . The updated invitation
 */
export const resendOrganizationInvitation = (endpoint: VerdocsEndpoint, email: string) =>
  endpoint.api //
    .post<IOrganizationInvitation>('/v2/organization-invitations/resend', {email})
    .then((r) => r.data);

/**
 * Get an invitation's details. This is generally used as the first step of accepting the invite.
 * A successful response will indicate that the invite token is still valid, and include some
 * metadata for the organization to style the acceptance screen.
 *
 * @group Organization Invitations
 * @api GET /v2/organization-invitations/:email/:token Get a pending invitation (_Authenticated via invite token, not an active session._). Intended to be called by the invitee to get details about the invitation they are about to accept.
 * @apiSuccess IOrganizationInvitation . Requested invitation's details. Will always include summary details for the organization, to be used for branding the accept-invite view.
 */
export const getOrganizationInvitation = (endpoint: VerdocsEndpoint, email: string, token: string) =>
  endpoint.api //
    .get<IOrganizationInvitation>(`/v2/organization-invitations/${email}/${token}`)
    .then((r) => r.data);

/**
 * Accept an invitation. This will automatically create a user record for the caller as well as a profile
 * with the appropriate role as specified in the invite. The profile will be set as "current" for the caller,
 * and session tokens will be returned to access the new profile. The profile's email_verified flag will
 * also be set to true.
 *
 * @group Organization Invitations
 * @api POST /v2/organization-invitations/accept Accept an invitation
 * @apiBody string email Email address for the invitee
 * @apiBody string token Invite token for the invitee
 * @apiBody string first_name First name
 * @apiBody string last_name Last name
 * @apiBody string password Password
 * @apiSuccess IAuthenticateResponse . Session credentials for the newly-created user's profile. If the user already had a profile for another organization, the new profile will be made "current" automatically.
 */
export const acceptOrganizationInvitation = (endpoint: VerdocsEndpoint, params: IAcceptOrganizationInvitationRequest) =>
  endpoint.api //
    .post<IAuthenticateResponse>('/v2/organization-invitations/accept', params)
    .then((r) => r.data);

/**
 * Decline an invitation. This will mark the status "declined," providing a visual indication to the
 * organization's admins that the invite was declined, preventing further invites from being created
 * to the same email address, and also preventing the invitee from receiving reminders to join.
 *
 * @group Organization Invitations
 * @api POST /v2/organization-invitations/decline Decline an invitation
 * @apiDescription Mark the status "declined," providing a visual indication to the organization's admins that the invite was declined, preventing further invites from being created to the same email address, and also preventing the invitee from receiving reminders to join.
 * @apiBody string email Email address for the invitee
 * @apiBody string token Invite token for the invitee
 * @apiSuccess string . Success. The invitation will be marked declined and the token will be invalidated.
 */
export const declineOrganizationInvitation = (endpoint: VerdocsEndpoint, email: string, token: string) =>
  endpoint.api //
    .post<{status: 'OK'}>('/v2/organization-invitations/decline', {email, token})
    .then((r) => r.data);
