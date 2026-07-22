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
 * @apiSuccess array(items: IProfile) . The caller's organization contacts
 *
 * @sdkOperation contact.getOrganizationContacts
 * @sdkGroup Contact
 * @sdkPage Endpoints
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
 * @api DELETE /v2/organization-contacts/:profile_id Delete organization contact
 * @apiParam string(format:uuid) profile_id The contact profile ID to delete.
 * @apiSuccess string . Success
 *
 * @sdkOperation contact.deleteOrganizationContact
 * @sdkGroup Contact
 * @sdkPage Endpoints
 */
export const deleteOrganizationContact = (endpoint: VerdocsEndpoint, profileId: string) =>
  endpoint.api //
    .delete(`/v2/organization-contacts/${profileId}`)
    .then((r) => r.data);

/**
 * Create a contact in the caller's organization.
 *
 * ```typescript
 * import {createOrganizationContact} from '@verdocs/js-sdk';
 *
 * const result = await createOrganizationContact(VerdocsEndpoint.getDefault(), 'PROFILEID', {first_name:'First', last_name:'Last', email:'a@b.com'});
 * ```
 *
 * @group Organization Contacts
 * @api POST /v2/organization-contacts Create organization contact
 * @apiBody string first_name Contact first name
 * @apiBody string last_name Contact last name
 * @apiBody string email Contact email address
 * @apiBody string phone? Contact phone number
 * @apiSuccess IProfile . The newly-created contact
 *
 * @sdkOperation contact.createOrganizationContact
 * @sdkGroup Contact
 * @sdkPage Endpoints
 */
export const createOrganizationContact = (
  endpoint: VerdocsEndpoint,
  params: Pick<IProfile, 'first_name' | 'last_name' | 'email' | 'phone'>,
) =>
  endpoint.api //
    .post(`/v2/organization-contacts`, params)
    .then((r) => r.data);

/**
 * Update a contact in the caller's organization.
 *
 * ```typescript
 * import {updateOrganizationContact} from '@verdocs/js-sdk';
 *
 * const result = await updateOrganizationContact(VerdocsEndpoint.getDefault(), 'PROFILEID', {first_name:'NewFirst'});
 * ```
 *
 * @group Organization Contacts
 * @api PATCH /v2/organization-contacts/:profile_id Update organization contact
 * @apiParam string(format:uuid) profile_id The contact profile ID to update.
 * @apiBody string first_name? Contact first name
 * @apiBody string last_name? Contact last name
 * @apiBody string email? Contact email address
 * @apiBody string phone? Contact phone number
 * @apiSuccess IProfile . The updated contact
 *
 * @sdkOperation contact.updateOrganizationContact
 * @sdkGroup Contact
 * @sdkPage Endpoints
 */
export const updateOrganizationContact = (
  endpoint: VerdocsEndpoint,
  profileId: string,
  params: Pick<IProfile, 'first_name' | 'last_name' | 'email' | 'phone'>,
) =>
  endpoint.api //
    .patch(`/v2/organization-contacts/${profileId}`, params)
    .then((r) => r.data);
