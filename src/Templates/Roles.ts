/**
 * A "role" is an individual participant in a signing flow, such as a signer or CC contact.
 * A role is a placeholder that will eventually become a named recipient. For example, "Tenant 1"
 * might be replaced with "John Smith" when the document is sent out for signature.
 *
 * Role names must be unique within a template, e.g. 'Recipient 1'. They may contain any [a-zA-Z0-9_- ]
 * characters, although it is recommended to keep them simple and human-readable, and to avoid
 * spaces (although they are allowed). If spaces are used in role names, be sure to URL-encode them
 * when calling endpoints like `updateRole()` e.g. 'Recipient%201'.
 *
 * NOTE: Roles are always enumerated under Template objects, so there are no "list" or "get" endpoints
 * for them. To get a template's latest role list, simply call `getTemplate()`.
 *
 * @module
 */

import {VerdocsEndpoint} from '../VerdocsEndpoint';
import {IRole} from '../Models';

/**
 * Create a role.
 *
 * ```typescript
 * import {createTemplateRole} from '@verdocs/js-sdk';
 *
 * const role = await createTemplateRole(VerdocsEndpoint.getDefault(), template_id, params...);
 * ```
 *
 * @group Roles
 * @api POST /v2/roles/:template_id Add a role to a template
 * @apiBody string name Name for the new role. Must be unique within the template. May include spaces, but later calls must URL-encode any references to this role, so it is recomended that special characters be avoided.
 * @apiBody string(enum:'signer' | 'cc' | 'approver') type Type of role to create. Signers act on documents by filling and signing fields. CC recipients receive a copy but do not act on the document. Approvers control the final submission of a document, but do not have fields of their own to fill out.
 * @apiBody string full_name? Default full name for the role. May be completed/overridden later, when envelopes are made from the template.
 * @apiBody string email? Default email address for the role. May be completed/overridden later, when envelopes are made from the template.
 * @apiBody string phone? Default (SMS-capable) phone number for the role. May be completed/overridden later, when envelopes are made from the template.
 * @apiBody string message? Optional message to include in email and SMS signing invitations.
 * @apiBody integer(min: 1, default: 1) sequence? Optional 1-based sequence number for the role. Roles that share the same sequence number act in parallel, and will receive invitations at the same time.
 * @apiBody integer(min: 1, default: 1) order? Optional 1-based order number for the role. Controls the left-to-right display order of roles at the same sequence number in the UI components e.g. `<verdocs-template-roles />`.
 * @apiBody boolean delegator? If true, the role may delegate their signing responsibility to another party.
 * @apiBody string(enum:'pin'|'identity'|'') kba_method? Active PIN- or Identity-based KBA for the role. NOTE: Some KBA operations may incur additional fees.
 * @apiSuccess IRole . The newly-created role
 */
export const createTemplateRole = (endpoint: VerdocsEndpoint, template_id: string, params: IRole) =>
  endpoint.api //
    .post<IRole>(`/v2/roles/${template_id}`, params)
    .then((r) => r.data);

/**
 * Update a role.
 *
 * ```typescript
 * import {updateTemplateRole} from '@verdocs/js-sdk';
 *
 * const role = await updateTemplateRole(VerdocsEndpoint.getDefault(), template_id, name, params...);
 * ```
 *
 * @group Roles
 * @api PATCH /v2/roles/:template_id/:role_id Update a role. See createRole for additional details on the parameters available.
 * @apiBody string name? Rename the role. Note that role names must be unique within a template, so this may fail if the new name is already in use.
 * @apiBody string(enum:'signer' | 'cc' | 'approver') type? Type of role.
 * @apiBody string full_name? Default full name for the role.
 * @apiBody string email? Default email address for the role.
 * @apiBody string phone? Default (SMS-capable) phone number for the role.
 * @apiBody string message? Optional message to include in email and SMS signing invitations.
 * @apiBody integer(min: 1, default: 1) sequence? Optional 1-based sequence number for the role.
 * @apiBody integer(min: 1, default: 1) order? Optional 1-based order number for the role.
 * @apiBody boolean delegator? If true, the role may delegate their signing responsibility to another party.
 * @apiBody string(enum:'pin'|'identity'|'') kba_method? Active PIN- or Identity-based KBA for the role.
 * @apiSuccess IRole . The newly-created role
 */
export const updateTemplateRole = (endpoint: VerdocsEndpoint, template_id: string, name: string, params: Partial<IRole>) =>
  endpoint.api //
    .patch<IRole>(`/v2/roles/${template_id}/${encodeURIComponent(name)}`, params)
    .then((r) => r.data);

/**
 * Delete a role.
 *
 * ```typescript
 * import {deleteTemplateRole} from '@verdocs/js-sdk';
 *
 * const profiles = await deleteTemplateRole(VerdocsEndpoint.getDefault(), template_id, name);
 * ```
 *
 * @group Roles
 * @api DELETE /v2/roles/:template_id/:role_id Delete a role.
 * @apiSuccess string . Success
 */
export const deleteTemplateRole = (endpoint: VerdocsEndpoint, template_id: string, name: string) =>
  endpoint.api //
    .delete(`/v2/roles/${template_id}/${encodeURIComponent(name)}`)
    .then((r) => r.data);
