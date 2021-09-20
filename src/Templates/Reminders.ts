import {Endpoint} from '../HTTP/Transport';

export const createTemplateReminder = (templateId: string) => Endpoint.post(`/templates/${templateId}/reminder/`).then((r) => r.data)

export const getTemplateReminder = (templateId: string, reminderId: string) => Endpoint.get(`/templates/${templateId}/reminder/${reminderId}`).then((r) => r.data)

export const editTemplateReminder = (templateId: string, reminderId: string) => Endpoint.put(`/templates/${templateId}/reminder/${reminderId}`).then((r) => r.data)

export const deleteTemplateReminder = (templateId: string, reminderId: string) => Endpoint.delete(`/templates/${templateId}/reminder/${reminderId}`).then((r) => r.data)