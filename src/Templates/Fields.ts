import {VerdocsEndpoint} from '../VerdocsEndpoint';
import {ITemplateField} from './Types';

/**
 * Add a field to a template.
 */
export const createField = (endpoint: VerdocsEndpoint, templateId: string, params: ITemplateField) =>
  endpoint.api //
    .post<ITemplateField>(`/templates/${templateId}/pages/`, params)
    .then((r) => r.data);

/**
 * Update a template field.
 */
export const editField = (endpoint: VerdocsEndpoint, templateId: string, fieldName: string, params: ITemplateField) =>
  endpoint.api //
    .put<ITemplateField>(`/templates/${templateId}/pages/${fieldName}`, params)
    .then((r) => r.data);

/**
 * REmove a field from a template.
 */
export const deleteField = (endpoint: VerdocsEndpoint, templateId: string, fieldName: string) =>
  endpoint.api //
    .delete(`/templates/${templateId}/pages/${fieldName}`)
    .then((r) => r.data);
