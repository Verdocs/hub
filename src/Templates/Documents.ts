import {Endpoint} from '../HTTP/Transport';

export const getTemplateDocuments = (templateId: string) => Endpoint.get(`/templates/${templateId}/documents/`).then((r) => r.data)

export const createTemplateDocument = (templateId: string) => Endpoint.post(`/templates/${templateId}/documents/`).then((r) => r.data)

export const getTemplateDocument = (templateId: string, documentId: string) => Endpoint.get(`/templates/${templateId}/documents/${documentId}`).then((r) => r.data)

export const deleteTemplateDocument = (templateId: string, documentId: string) => Endpoint.delete(`/templates/${templateId}/documents/${documentId}`).then((r) => r.data)