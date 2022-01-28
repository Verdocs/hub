import {getEndpoint} from '../HTTP/Transport';
import {ITemplateField} from './Types';

/**
 * Add a field to a template.
 */
export const createField = (templateId: string, params: ITemplateField) =>
  getEndpoint()
    .api.post<ITemplateField>(`/templates/${templateId}/pages/`, params)
    .then((r) => r.data);

/**
 * Update a template field.
 */
export const editField = (templateId: string, fieldName: string, params: ITemplateField) =>
  getEndpoint()
    .api.put<ITemplateField>(`/templates/${templateId}/pages/${fieldName}`, params)
    .then((r) => r.data);

/**
 * REmove a field from a template.
 */
export const deleteField = (templateId: string, fieldName: string) =>
  getEndpoint()
    .api.delete(`/templates/${templateId}/pages/${fieldName}`)
    .then((r) => r.data);
