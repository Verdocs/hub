import {Endpoint} from '../HTTP/Transport';

export const createTemplatePage = (templateId: string) => Endpoint.post(`/templates/${templateId}/pages/`).then((r) => r.data)

export const editTemplatePage = (templateId: string, sequence: string) => Endpoint.put(`/templates/${templateId}/pages/${sequence}`).then((r) => r.data)

export const getTemplatePage = (templateId: string, sequence: string) => Endpoint.get(`/templates/${templateId}/pages/${sequence}`).then((r) => r.data)

export const deleteTemplatePage = (templateId: string, sequence: string) => Endpoint.delete(`/templates/${templateId}/pages/${sequence}`).then((r) => r.data)