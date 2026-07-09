import {VerdocsEndpoint} from '../VerdocsEndpoint';
import {IProfile} from '../Models';

/**
 * An Organization Contact (aka Profile) is an individual user with no access to an organization. These entries
 * appear only in contact lists, usually to populate quick-search dropdowns when sending envelopes.
 *
 * @module
 */

/**
 * Get a list of the contacts in the caller's organization.
 *
 * ```typescript
 * import {getOrganizationContacts} from '@verdocs/js-sdk';
 *
 * const members = await getOrganizationContacts(VerdocsEndpoint.getDefault()});
 * ```
 *
 * @group Organization Contacts
 * @api GET /v2/organization-contacts Get a list of organization contacts
 * @apiBody string email Email address for the invitee
 * @apiBody string token Invite token for the invitee
 * @apiSuccess string . Success. The invitation will be marked declined and the token will be invalidated.
 */
export const getOrganizationContacts = (endpoint: VerdocsEndpoint) =>
  endpoint.api //
    .get<IProfile[]>(`/v2/organization-contacts`)
    .then((r) => r.data);

/**
 * Delete a contact from the caller's organization. Note that the caller must be an admin or owner.
 *
 * ```typescript
 * import {deleteOrganizationContact} from '@verdocs/js-sdk';
 *
 * await deleteOrganizationContact(VerdocsEndpoint.getDefault(), 'PROFILEID'});
 * ```
 *
 * @group Organization Contacts
 * @api POST /v2/organization-invitations/decline GET a list of pending invitations
 * @apiBody string email Email address for the invitee
 * @apiBody string token Invite token for the invitee
 * @apiSuccess string . Success. The invitation will be marked declined and the token will be invalidated.
 */
export const deleteOrganizationContact = (endpoint: VerdocsEndpoint, profileId: string) =>
  endpoint.api //
    .delete(`/v2/organization-contacts/${profileId}`)
    .then((r) => r.data);

/**
 * Update a member.
 *
 * ```typescript
 * import {createOrganizationContact} from '@verdocs/js-sdk';
 *
 * const result = await createOrganizationContact(VerdocsEndpoint.getDefault(), 'PROFILEID', {first_name:'First', last_name:'Last', email:'a@b.com'});
 * ```
 */
export const createOrganizationContact = (
  endpoint: VerdocsEndpoint,
  params: Pick<IProfile, 'first_name' | 'last_name' | 'email' | 'phone'>,
) =>
  endpoint.api //
    .post(`/v2/organization-contacts`, params)
    .then((r) => r.data);

/**
 * Update a member.
 *
 * ```typescript
 * import {updateOrganizationContact} from '@verdocs/js-sdk';
 *
 * const result = await updateOrganizationContact(VerdocsEndpoint.getDefault(), 'PROFILEID', {first_name:'NewFirst'});
 * ```
 */
export const updateOrganizationContact = (
  endpoint: VerdocsEndpoint,
  profileId: string,
  params: Pick<IProfile, 'first_name' | 'last_name' | 'email' | 'phone'>,
) =>
  endpoint.api //
    .patch(`/v2/organization-contacts/${profileId}`, params)
    .then((r) => r.data);
