import {getEndpoint} from '../HTTP/Transport';
import {ITemplateField, IRole} from './Types';

/**
 * A "role" is an individual participant in a signing flow, such as a signer or CC contact. Roles are identified by
 * their names, which must be unique (e.g. 'Recipient 1'). Template fields are assigned to roles for signing operations,
 * so you may have 'Recipient 1 Signature 1' and so forth.
 *
 * @module
 */

export const createRole = (templateId: string, params: IRole) =>
  getEndpoint()
    .api.post<IRole>(`/templates/${templateId}/roles/`, params)
    .then((r) => r.data);

export const getRoles = (templateId: string) =>
  getEndpoint()
    .api.get<IRole[]>(`/templates/${templateId}/roles/`)
    .then((r) => r.data);

export const getRole = (templateId: string, roleName: string) =>
  getEndpoint()
    .api.get<IRole>(`/templates/${templateId}/roles/${roleName}`)
    .then((r) => r.data);

export const editRole = (templateId: string, roleName: string, params: IRole) =>
  getEndpoint()
    .api.put<IRole>(`/templates/${templateId}/roles/${roleName}`, params)
    .then((r) => r.data);

export const deleteRole = (templateId: string, roleName: string) =>
  getEndpoint()
    .api.delete(`/templates/${templateId}/roles/${roleName}`)
    .then((r) => r.data);

export const getRoleFields = (templateId: string, roleName: string) =>
  getEndpoint()
    .api.get<ITemplateField[]>(`/templates/${templateId}/roles/${roleName}/fields`)
    .then((r) => r.data);

export const deleteSequence = (templateId: string) =>
  getEndpoint()
    .api.delete<IRole[]>(`/templates/${templateId}/roles/`)
    .then((r) => r.data);
