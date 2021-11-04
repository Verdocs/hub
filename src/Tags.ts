import {getEndpoint} from './HTTP/Transport';

export interface ITags {
  name: string;
  featured?: boolean;
  created_at?: Date;
}

export const createTag = (params: ITags) =>
  getEndpoint()
    .post<ITags>('/tags', params)
    .then((r) => r.data);

export const getTag = (tagName: string) =>
  getEndpoint()
    .get<ITags>(`/tags/${tagName}`)
    .then((r) => r.data);

export const searchTag = (params: any) =>
  getEndpoint()
    .get<ITags[]>('/tags', params)
    .then((r) => r.data);
