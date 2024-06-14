import {VerdocsEndpoint} from '../VerdocsEndpoint';
import {IInitial} from '../Models';

/**
 * Create an initials block. In a typical signing workflow, the user is asked at the beginning of the process to "adopt"
 * an initials block to be used for all initials fields in the document. Thus, this is typically called one time to
 * create and store an initials block. Thereafter, the ID of the initials block may be re-used for each initials field
 * to be "stamped" by the user.
 */
export const createInitials = (endpoint: VerdocsEndpoint, name: string, initials: Blob) => {
  const data = new FormData();
  data.append('initial', initials, name);

  return endpoint.api //
    .post<IInitial>(`/initials`, data)
    .then((r) => r.data);
};
