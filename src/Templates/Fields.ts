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
 */
export const updateField = (endpoint: VerdocsEndpoint, templateId: string, name: string, params: Partial<ITemplateField>) =>
  endpoint.api //
    .patch<ITemplateField>(`/fields/${templateId}/${name}`, params)
    .then((r) => r.data);

/**
 * Remove a field from a template.
 *
 * ```typescript
 * import {deleteField} from '@verdocs/js-sdk/Templates';
 *
 * await deleteField((VerdocsEndpoint.getDefault(), template_id, field_name);
 * ```
 */
export const deleteField = (endpoint: VerdocsEndpoint, templateId: string, name: string) =>
  endpoint.api //
    .delete(`/fields/${templateId}/${name}`)
    .then((r) => r.data);
