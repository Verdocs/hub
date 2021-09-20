import {Endpoint} from '../HTTP/Transport';

export const createTemplateField = (templateId: string) => Endpoint.post(`/templates/${templateId}/pages/`).then((r) => r.data)

export const editTemplateField = (templateId: string, fieldName: string) => Endpoint.put(`/templates/${templateId}/pages/${fieldName}`).then((r) => r.data)

export const deleteTemplateField = (templateId: string, fieldName: string) => Endpoint.delete(`/templates/${templateId}/pages/${fieldName}`).then((r) => r.data)