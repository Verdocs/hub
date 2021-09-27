import {Endpoint} from './HTTP/Transport';

export interface ISignature {
  id?: string;
  profile_id: string;
  url: string;
  created_at?: Date;
  updated_at?: Date;
}

export const createSignature = (params: any) =>
  Endpoint.post<ISignature>('/signatures', params).then((r) => r.data);

export const getSignatures = () => Endpoint.get<ISignature[]>('/signatures').then((r) => r.data);

export const getSignature = (signatureId: string) => Endpoint.get(`/signatures/${signatureId}`).then((r) => r.data);

export const deleteSignature = (signatureId: string) =>
  Endpoint.delete(`/signatures/${signatureId}`).then((r) => r.data);
