import {VerdocsEndpoint} from '../VerdocsEndpoint';
import {ITemplateField} from '../Models';

/**
 * Add a field to a template.
 *
 * ```typescript
 * import {createField} from '@verdocs/js-sdk/Templates';
 *
 * await createField((VerdocsEndpoint.getDefault(), template_id, { ... });
 * ```
 *
 * @group Fields
 * @api POST /v2/fields/:template_id Add a field to a template
 * @apiBody string name Name for the new field. Field names must be unique within a template. Although special characters are allowed, they must be URL-encoded in subsequent requests, so it is recommended to use only alphanumeric characters and hyphens if possible.
 * @apiBody string role_name Role to assign to the field. Role names must be valid, so it is recommended to create roles before fields.
 * @apiBody string document_id ID of the document upon which to place the field.
 * @apiBody string(enum: 'signature' | 'initial' | 'checkbox' | 'radio' | 'textbox' | 'timestamp' | 'date' | 'dropdown' | 'textarea' | 'attachment' | 'payment') type Type of field to create
 * @apiBody boolean(default: false) required Whether the field is required
 * @apiBody integer(min: 0) page 0-based page number upon which to place the field
 * @apiBody integer(min: 0) x X position for the field (left to right)
 * @apiBody integer(min: 0) y Y position for the field (_bottom to top!_)
 * @apiBody string label? Optional label to display above the field
 * @apiBody integer(min: 50) width? Width of the field. Note that all fields have built-in defaults, and it is recommended that this only be set on text fields.
 * @apiBody integer(min: 15) height? Height of the field. Note that all fields have built-in defaults, and it is recommended that this only be set on text fields.
 * @apiBody string placeholder? Optional placeholder to display in text fields
 * @apiBody string group? For fields that support grouping (radio buttons and check boxes) the value selected will be stored under this name
 * @apiBody array(items:IDropdownOption) options? For dropdown fields, the options to display
 * @apiBody string value? Optional default value to set on the field
 * @apiSuccess ITemplateField . Template field
 */
export const createField = (endpoint: VerdocsEndpoint, templateId: string, params: ITemplateField) =>
  endpoint.api //
    .post<ITemplateField>(`/v2/fields/${templateId}`, params)
    .then((r) => r.data);

/**
 * Update a template field.
 *
 * ```typescript
 * import {updateField} from '@verdocs/js-sdk/Templates';
 *
 * await updateField((VerdocsEndpoint.getDefault(), template_id, field_name, { ... });
 * ```
 *
 * @group Fields
 * @api PATCH /v2/fields/:template_id/:field_name Update a field. See createField for additional details on the supported parameters.
 * @apiBody string name? Rename the field. Note that template field names must be unique within a template.
 * @apiBody string role_name Role to assign to the field.
 * @apiBody string document_id ID of the document upon which to place the field.
 * @apiBody string(enum: 'signature' | 'initial' | 'checkbox' | 'radio' | 'textbox' | 'timestamp' | 'date' | 'dropdown' | 'textarea' | 'attachment' | 'payment') type? Change the field type. Note that while this is technically allowed, fields have different behaviors, validators, default sizes, etc. It is usually easier to add a new field and delete the old one.
 * @apiBody boolean(default: false) required? Whether the field is required
 * @apiBody integer(min: 0) page? 0-based page number upon which to place the field
 * @apiBody integer(min: 0) x? X position for the field (left to right)
 * @apiBody integer(min: 0) y? Y position for the field (_bottom to top!_)
 * @apiBody string label? Optional label to display above the field
 * @apiBody integer(min: 50) width? Width of the field. Note that all fields have built-in defaults, and it is recommended that this only be set on text fields.
 * @apiBody integer(min: 15) height? Height of the field. Note that all fields have built-in defaults, and it is recommended that this only be set on text fields.
 * @apiBody string placeholder? Optional placeholder to display in text fields
 * @apiBody string group? For fields that support grouping (radio buttons and check boxes) the value selected will be stored under this name
 * @apiBody array(items:IDropdownOption) options? For dropdown fields, the options to display
 * @apiBody string value? Optional default value to set on the field
 * @apiSuccess ITemplateField . Updated template field
 */
export const updateField = (endpoint: VerdocsEndpoint, templateId: string, name: string, params: Partial<ITemplateField>) =>
  endpoint.api //
    .patch<ITemplateField>(`/v2/fields/${templateId}/${encodeURIComponent(name)}`, params)
    .then((r) => r.data);

/**
 * Remove a field from a template.
 *
 * ```typescript
 * import {deleteField} from '@verdocs/js-sdk/Templates';
 *
 * await deleteField((VerdocsEndpoint.getDefault(), template_id, field_name);
 * ```
 *
 * @group Fields
 * @api DELETE /v2/fields/:template_id/:field_name Delete a field
 * @apiSuccess string . Success
 */
export const deleteField = (endpoint: VerdocsEndpoint, templateId: string, name: string) =>
  endpoint.api //
    .delete(`/v2/fields/${templateId}/${encodeURIComponent(name)}`)
    .then((r) => r.data);
