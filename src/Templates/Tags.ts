import {Endpoint} from '../HTTP/Transport';
import {ITag} from "./Types";

export const createTag = (templateId: string, params: any) =>
  Endpoint.post<ITag>(`/templates/${templateId}/tags/`, params).then((r) => r.data);

export const getTags = (templateId: string) =>
  Endpoint.get<ITag[]>(`/templates/${templateId}/tags/`).then((r) => r.data);

export const deleteTag = (templateId: string, tagName: string) =>
  Endpoint.post(`/templates/${templateId}/tags/${tagName}`).then((r) => r.data);
