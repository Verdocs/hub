import {Endpoint} from './HTTP/Transport';

export interface ITags {
  name: string;
  featured?: boolean;
  created_at?: Date;
}

export const createTag = () => Endpoint.post<ITags>('/tags').then((r) => r.data);

export const getTag = (tagName: string) => Endpoint.get<ITags>(`/tags/${tagName}`).then((r) => r.data);

export const searchTag = () => Endpoint.get<ITags[]>('/tags').then((r) => r.data);
