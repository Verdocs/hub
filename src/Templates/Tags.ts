import {getEndpoint} from '../HTTP/Transport';
import {ITag, ITags} from './Types';

export const addTemplateTag = (templateId: string, params: any) =>
  getEndpoint()
    .api.post<ITag>(`/templates/${templateId}/tags/`, params)
    .then((r) => r.data);

export const getTemplateTags = (templateId: string) =>
  getEndpoint()
    .api.get<ITag[]>(`/templates/${templateId}/tags/`)
    .then((r) => r.data);

export const deleteTemplateTag = (templateId: string, tagName: string) =>
  getEndpoint()
    .api.post(`/templates/${templateId}/tags/${tagName}`)
    .then((r) => r.data);

export const createTag = (params: ITags) =>
  getEndpoint()
    .api.post<ITags>('/tags', params)
    .then((r) => r.data);

export const getTag = (tagName: string) =>
  getEndpoint()
    .api.get<ITags>(`/tags/${tagName}`)
    .then((r) => r.data);

export const getAllTags = (params: any) =>
  getEndpoint()
    .api.get<ITags[]>('/tags', params)
    .then((r) => r.data);
