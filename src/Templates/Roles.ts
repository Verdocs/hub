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
 */
export const deleteTemplateRole = (endpoint: VerdocsEndpoint, template_id: string, name: string) =>
  endpoint.api //
    .delete(`/v2/roles/${template_id}/${encodeURIComponent(name)}`)
    .then((r) => r.data);
