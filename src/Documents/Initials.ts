import {VerdocsEndpoint} from '../VerdocsEndpoint';

export interface IInitials {
  id?: string;
  profile_id: string;
  url: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Create an initials block. In a typical signing workflow, the user is asked at the beginning of the process to "adopt"
 * an initials block to be used for all initials fields in the document. Thus, this is typically called one time to
 * create and store an initials block. Thereafter, the ID of the initials block may be re-used for each initials field
 * to be "stamped" by the user.
 */
export const createInitials = (endpoint: VerdocsEndpoint, name: string, initials: string | Blob) => {
  const data = new FormData();
  data.append('initial', initials, name);

  return endpoint.api //
    .post<IInitials>(`/initials`, data)
    .then((r) => r.data);
};
