import {Endpoint} from '../HTTP/Transport';

export const createTemplateTag = (templateId: string) => Endpoint.post(`/templates/${templateId}/tags/`).then((r) => r.data)

export const getTemplateTags = (templateId: string) => Endpoint.get(`/templates/${templateId}/tags/`).then((r) => r.data)

export const deleteTemplateTag = (templateId: string, tagName: string) => Endpoint.post(`/templates/${templateId}/tags/${tagName}`).then((r) => r.data)