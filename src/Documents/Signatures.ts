import {getEndpoint} from '../HTTP/Transport';

export interface ISignature {
  id: string;
  profile_id: string;
  url: string;
  deleted: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Create a signature block. In a typical signing workflow, the user is asked at the beginning of the process to "adopt"
 * a signature block to be used for all signature fields in the document. Thus, this is typically called one time to
 * create and store a signature block. Thereafter, the ID of the signature block may be re-used for each signature field
 * to be "stamped" by the user.
 */
export const createSignature = (name: string, signature: string | Blob) => {
  const data = new FormData();
  data.append('signature', signature, name);

  return getEndpoint()
    .api.post<ISignature>(`/signatures`, data)
    .then((r) => r.data);
};

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
