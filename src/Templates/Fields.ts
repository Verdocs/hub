import {VerdocsEndpoint} from '../VerdocsEndpoint';
import {ITemplateField} from './Types';

/**
 * Add a field to a template.
 */
export const createField = (endpoint: VerdocsEndpoint, templateId: string, params: ITemplateField) =>
  endpoint.api //
    // curl -X POST 'https://api.verdocs.com/templates/d2338742-f3a1-465b-8592-806587413cc1/fields' \
    .post<ITemplateField>(`/templates/${templateId}/fields`, params)
    .then((r) => r.data);

/**
 * Update a template field.
 */
export const editField = (endpoint: VerdocsEndpoint, templateId: string, fieldName: string, params: ITemplateField) =>
  endpoint.api //
    .put<ITemplateField>(`/templates/${templateId}/fields/${fieldName}`, params)
    .then((r) => r.data);

/**
 * REmove a field from a template.
 */
export const deleteField = (endpoint: VerdocsEndpoint, templateId: string, fieldName: string) =>
  endpoint.api //
    .delete(`/templates/${templateId}/fields/${fieldName}`)
    .then((r) => r.data);
