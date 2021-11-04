import {getEndpoint} from '../HTTP/Transport';
import {ITag} from './Types';

export const createTag = (templateId: string, params: any) =>
  getEndpoint()
    .post<ITag>(`/templates/${templateId}/tags/`, params)
    .then((r) => r.data);

export const getTags = (templateId: string) =>
  getEndpoint()
    .get<ITag[]>(`/templates/${templateId}/tags/`)
    .then((r) => r.data);

export const deleteTag = (templateId: string, tagName: string) =>
  getEndpoint()
    .post(`/templates/${templateId}/tags/${tagName}`)
    .then((r) => r.data);
