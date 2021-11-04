import {getEndpoint} from '../HTTP/Transport';
import {IPage} from './Types';

export const createPage = (templateId: string, params: IPage) =>
  getEndpoint()
    .post<IPage>(`/templates/${templateId}/pages/`, params)
    .then((r) => r.data);

export const editPage = (templateId: string, sequence: string) =>
  getEndpoint()
    .put(`/templates/${templateId}/pages/${sequence}`)
    .then((r) => r.data);

export const getPage = (templateId: string, sequence: string) =>
  getEndpoint()
    .get(`/templates/${templateId}/pages/${sequence}`)
    .then((r) => r.data);

export const deletePage = (templateId: string, sequence: string) =>
  getEndpoint()
    .delete(`/templates/${templateId}/pages/${sequence}`)
    .then((r) => r.data);
