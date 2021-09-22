import {Endpoint} from '../HTTP/Transport';

export const createTemplateRole = (templateId: string) =>
  Endpoint.post(`/templates/${templateId}/roles/`).then((r) => r.data);

export const getTemplateRoles = (templateId: string) =>
  Endpoint.get(`/templates/${templateId}/roles/`).then((r) => r.data);

export const getTemplateRole = (templateId: string, roleName: string) =>
  Endpoint.get(`/templates/${templateId}/roles/${roleName}`).then((r) => r.data);

export const editTemplateRole = (templateId: string, roleName: string) =>
  Endpoint.put(`/templates/${templateId}/roles/${roleName}`).then((r) => r.data);

export const deleteTemplateRole = (templateId: string, roleName: string) =>
  Endpoint.delete(`/templates/${templateId}/roles/${roleName}`).then((r) => r.data);

export const deleteTemplateSequence = (templateId: string) =>
  Endpoint.post(`/templates/${templateId}/roles/`).then((r) => r.data);
