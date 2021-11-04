import {getEndpoint} from '../HTTP/Transport';

export interface ISignature {
  id?: string;
  profile_id: string;
  url: string;
  created_at?: Date;
  updated_at?: Date;
}

export const createSignature = (params: any) =>
  getEndpoint()
    .post<ISignature>('/signatures', params)
    .then((r) => r.data);

export const getSignatures = () =>
  getEndpoint()
    .get<ISignature[]>('/signatures')
    .then((r) => r.data);

export const getSignature = (signatureId: string) =>
  getEndpoint()
    .get(`/signatures/${signatureId}`)
    .then((r) => r.data);

export const deleteSignature = (signatureId: string) =>
  getEndpoint()
    .delete(`/signatures/${signatureId}`)
    .then((r) => r.data);
