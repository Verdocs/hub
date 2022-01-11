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
    .api.post<ISignature>('/signatures', params)
    .then((r) => r.data);

export const getSignatures = () =>
  getEndpoint()
    .api.get<ISignature[]>('/signatures')
    .then((r) => r.data);

export const getSignature = (signatureId: string) =>
  getEndpoint()
    .api.get(`/signatures/${signatureId}`)
    .then((r) => r.data);

export const deleteSignature = (signatureId: string) =>
  getEndpoint()
    .api.delete(`/signatures/${signatureId}`)
    .then((r) => r.data);
