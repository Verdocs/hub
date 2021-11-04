import {getEndpoint} from '../HTTP/Transport';
import {ITag, ITags} from './Types';

export const addTemplateTag = (templateId: string, params: any) =>
  getEndpoint()
    .post<ITag>(`/templates/${templateId}/tags/`, params)
    .then((r) => r.data);

export const getTemplateTags = (templateId: string) =>
  getEndpoint()
    .get<ITag[]>(`/templates/${templateId}/tags/`)
    .then((r) => r.data);

export const deleteTemplateTag = (templateId: string, tagName: string) =>
  getEndpoint()
    .post(`/templates/${templateId}/tags/${tagName}`)
    .then((r) => r.data);

export const createTag = (params: ITags) =>
  getEndpoint()
    .post<ITags>('/tags', params)
    .then((r) => r.data);

export const getTag = (tagName: string) =>
  getEndpoint()
    .get<ITags>(`/tags/${tagName}`)
    .then((r) => r.data);

export const getAllTags = (params: any) =>
  getEndpoint()
    .get<ITags[]>('/tags', params)
    .then((r) => r.data);
