import {Endpoint} from './HTTP/Transport';

export interface ITags {
  name: string;
  featured?: boolean;
  created_at?: Date;
}

export const createTag = (params: ITags) => Endpoint.post<ITags>('/tags', params).then((r) => r.data);

export const getTag = (tagName: string) => Endpoint.get<ITags>(`/tags/${tagName}`).then((r) => r.data);

export const searchTag = (params: any) => Endpoint.get<ITags[]>('/tags', params).then((r) => r.data);
