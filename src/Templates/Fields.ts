import {getEndpoint} from '../HTTP/Transport';
import {ITemplateField} from './Types';

export const createField = (templateId: string, params: ITemplateField) =>
  getEndpoint()
    .api.post<ITemplateField>(`/templates/${templateId}/pages/`, params)
    .then((r) => r.data);

export const editField = (templateId: string, fieldName: string, params: ITemplateField) =>
  getEndpoint()
    .api.put<ITemplateField>(`/templates/${templateId}/pages/${fieldName}`, params)
    .then((r) => r.data);

export const deleteField = (templateId: string, fieldName: string) =>
  getEndpoint()
    .api.delete(`/templates/${templateId}/pages/${fieldName}`)
    .then((r) => r.data);
