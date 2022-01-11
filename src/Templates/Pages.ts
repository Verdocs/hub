import {getEndpoint} from '../HTTP/Transport';
import {IPage} from './Types';

export const createPage = (templateId: string, params: IPage) =>
  getEndpoint()
    .api.post<IPage>(`/templates/${templateId}/pages/`, params)
    .then((r) => r.data);

export const editPage = (templateId: string, sequence: string) =>
  getEndpoint()
    .api.put(`/templates/${templateId}/pages/${sequence}`)
    .then((r) => r.data);

export const getPage = (templateId: string, sequence: string) =>
  getEndpoint()
    .api.get(`/templates/${templateId}/pages/${sequence}`)
    .then((r) => r.data);

export const deletePage = (templateId: string, sequence: string) =>
  getEndpoint()
    .api.delete(`/templates/${templateId}/pages/${sequence}`)
    .then((r) => r.data);
