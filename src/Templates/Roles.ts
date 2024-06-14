/**
 * A "role" is an individual participant in a signing flow, such as a signer or CC contact. Roles are identified by
 * their names, which must be unique (e.g. 'Recipient 1'). Template fields are assigned to roles for signing operations,
 * so you may have 'Recipient 1 Signature 1' and so forth.
 *
 * @module
 */

import {VerdocsEndpoint} from '../VerdocsEndpoint';
import {ITemplateField, IRole} from '../Models';

export const createRole = (endpoint: VerdocsEndpoint, templateId: string, params: IRole) =>
  endpoint.api //
    .post<IRole>(`/templates/${templateId}/roles`, params)
    .then((r) => r.data);

export const getRoles = (endpoint: VerdocsEndpoint, templateId: string) =>
  endpoint.api //
    .get<IRole[]>(`/templates/${templateId}/roles`)
    .then((r) => r.data);

export const getRole = (endpoint: VerdocsEndpoint, templateId: string, roleName: string) =>
  endpoint.api //
    .get<IRole>(`/templates/${templateId}/roles/${roleName}`)
    .then((r) => r.data);

export const updateRole = (endpoint: VerdocsEndpoint, templateId: string, roleName: string, params: Partial<IRole>) =>
  endpoint.api //
    .put<IRole>(`/templates/${templateId}/roles/${roleName}`, params)
    .then((r) => r.data);

export const deleteRole = (endpoint: VerdocsEndpoint, templateId: string, roleName: string) =>
  endpoint.api //
    .delete(`/templates/${templateId}/roles/${roleName}`)
    .then((r) => r.data);

export const getRoleFields = (endpoint: VerdocsEndpoint, templateId: string, roleName: string) =>
  endpoint.api //
    .get<ITemplateField[]>(`/templates/${templateId}/roles/${roleName}/fields`)
    .then((r) => r.data);

export const deleteSequence = (endpoint: VerdocsEndpoint, templateId: string) =>
  endpoint.api //
    .delete<IRole[]>(`/templates/${templateId}/roles`)
    .then((r) => r.data);
