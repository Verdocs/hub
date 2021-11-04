import {getEndpoint} from '../HTTP/Transport';
import {IField, IRole} from './Types';

export const createRole = (templateId: string, params: IRole) =>
  getEndpoint()
    .post<IRole>(`/templates/${templateId}/roles/`, params)
    .then((r) => r.data);

export const getRoles = (templateId: string) =>
  getEndpoint()
    .get<IRole[]>(`/templates/${templateId}/roles/`)
    .then((r) => r.data);

export const getRole = (templateId: string, roleName: string) =>
  getEndpoint()
    .get<IRole>(`/templates/${templateId}/roles/${roleName}`)
    .then((r) => r.data);

export const editRole = (templateId: string, roleName: string, params: IRole) =>
  getEndpoint()
    .put<IRole>(`/templates/${templateId}/roles/${roleName}`, params)
    .then((r) => r.data);

export const deleteRole = (templateId: string, roleName: string) =>
  getEndpoint()
    .delete(`/templates/${templateId}/roles/${roleName}`)
    .then((r) => r.data);

export const getRoleFields = (templateId: string, roleName: string) =>
  getEndpoint()
    .get<IField[]>(`/templates/${templateId}/roles/${roleName}/fields`)
    .then((r) => r.data);

export const deleteSequence = (templateId: string) =>
  getEndpoint()
    .delete<IRole[]>(`/templates/${templateId}/roles/`)
    .then((r) => r.data);
