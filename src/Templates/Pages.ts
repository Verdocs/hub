import {Endpoint} from '../HTTP/Transport';
import {IPage} from './Types';

export const createPage = (templateId: string, params: IPage) =>
  Endpoint.post<IPage>(`/templates/${templateId}/pages/`, params).then((r) => r.data);

export const editPage = (templateId: string, sequence: string) =>
  Endpoint.put(`/templates/${templateId}/pages/${sequence}`).then((r) => r.data);

export const getPage = (templateId: string, sequence: string) =>
  Endpoint.get(`/templates/${templateId}/pages/${sequence}`).then((r) => r.data);

export const deletePage = (templateId: string, sequence: string) =>
  Endpoint.delete(`/templates/${templateId}/pages/${sequence}`).then((r) => r.data);
