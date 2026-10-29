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
import {IRolePosition} from './Types';
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
 * @apiParam string(format:uuid) template_id The template ID.
 * @apiBody string name Name for the new role. Must be unique within the template. May include spaces, but later calls must URL-encode any references to this role, so it is recomended that special characters be avoided.
 * @apiBody string(enum:'signer' | 'cc' | 'approver') type Type of role to create. Signers act on documents by filling and signing fields. CC recipients receive a copy but do not act on the document. Approvers control the final submission of a document, but do not have fields of their own to fill out.
 * @apiBody string full_name? Default full name for the role. May be completed/overridden later, when envelopes are made from the template.
 * @apiBody string email? Default email address for the role. May be completed/overridden later, when envelopes are made from the template.
 * @apiBody string phone? Default (SMS-capable) phone number for the role. May be completed/overridden later, when envelopes are made from the template.
 * @apiBody string message? Optional message to include in email and SMS signing invitations.
 * @apiBody integer(min: 1, default: 1) sequence? Optional 1-based sequence number for the role. Roles that share the same sequence number act in parallel, and will receive invitations at the same time.
 * @apiBody integer(min: 1, default: 1) order? Optional 1-based order number for the role. Controls the left-to-right display order of roles at the same sequence number in the UI components e.g. `<verdocs-template-roles />`.
 * @apiBody boolean delegator? If true, the role may delegate their signing responsibility to another party.
 * @apiSuccess IRole . The newly-created role
 *
 * @sdkOperation role.createTemplateRole
 * @sdkGroup Role
 * @sdkPage Endpoints
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
 * @api PATCH /v2/roles/:template_id/:role_name Update a role
 * @apiParam string(format:uuid) template_id The template ID.
 * @apiParam string role_name The role name to update.
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
 *
 * @sdkOperation role.updateTemplateRole
 * @sdkGroup Role
 * @sdkPage Endpoints
 */
export const updateTemplateRole = (endpoint: VerdocsEndpoint, template_id: string, name: string, params: Partial<IRole>) =>
  endpoint.api //
    .patch<IRole>(`/v2/roles/${template_id}/${encodeURIComponent(name)}`, params)
    .then((r) => r.data);

/**
 * Move several roles between steps in one call, such as when swapping two steps. Roles you leave out keep their places.
 * The template's roles come back with steps numbered 1..N and each step's roles numbered 1..M.
 *
 * ```typescript
 * import {arrangeTemplateRoles} from '@verdocs/js-sdk';
 *
 * const roles = await arrangeTemplateRoles(VerdocsEndpoint.getDefault(), template_id, [
 *   {name: 'Seller', sequence: 1},
 *   {name: 'Buyer', sequence: 2},
 * ]);
 * ```
 *
 * @group Roles
 * @api PATCH /v2/roles/:template_id Arrange roles
 * @apiParam string(format:uuid) template_id The template ID.
 * @apiBody array(items:IRolePosition) roles The roles to move, each with its new step (sequence) and optionally its place within the step (order).
 * @apiSuccess array(items:IRole) . All of the template's roles, in workflow order
 *
 * @sdkOperation role.arrangeTemplateRoles
 * @sdkGroup Role
 * @sdkPage Endpoints
 */
export const arrangeTemplateRoles = (endpoint: VerdocsEndpoint, template_id: string, roles: IRolePosition[]) =>
  endpoint.api //
    .patch<IRole[]>(`/v2/roles/${template_id}`, {roles})
    .then((r) => r.data);

/**
 * Number a template's steps 1..N and each step's roles 1..M, the way the api stores them after any role change. Roles named
 * in `first` win ties for a spot, in that order, so a role just placed at an occupied spot takes it. Use it to show a move
 * before the api replies.
 *
 * ```typescript
 * import {renumberRoles} from '@verdocs/js-sdk';
 *
 * renumberRoles([{name: 'Buyer', sequence: 1, order: 1}, {name: 'Seller', sequence: 3, order: 1}]);
 * // Seller is now at sequence 2
 * ```
 *
 * @sdkOperation role.renumberRoles
 * @sdkGroup Role
 * @sdkPage Helpers
 */
export const renumberRoles = <T extends {name: string; sequence: number; order: number}>(roles: T[], first: string[] = []): T[] => {
  const rank = (name: string) => (first.includes(name) ? first.indexOf(name) : first.length);
  const sorted = [...roles].sort(
    (a, b) => a.sequence - b.sequence || a.order - b.order || rank(a.name) - rank(b.name) || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0),
  );

  const steps = [...new Set(sorted.map((role) => role.sequence))];
  const counts: number[] = [];
  return sorted.map((role) => {
    const sequence = steps.indexOf(role.sequence) + 1;
    counts[sequence] = (counts[sequence] || 0) + 1;
    return {...role, sequence, order: counts[sequence]};
  });
};

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
 * @api DELETE /v2/roles/:template_id/:role_name Delete a role.
 * @apiParam string(format:uuid) template_id The template ID.
 * @apiParam string role_name The role name to delete.
 * @apiSuccess string . Success
 *
 * @sdkOperation role.deleteTemplateRole
 * @sdkGroup Role
 * @sdkPage Endpoints
 */
export const deleteTemplateRole = (endpoint: VerdocsEndpoint, template_id: string, name: string) =>
  endpoint.api //
    .delete(`/v2/roles/${template_id}/${encodeURIComponent(name)}`)
    .then((r) => r.data);
