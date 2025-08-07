import {VerdocsEndpoint} from '../VerdocsEndpoint';
import {IInitial} from '../Models';

/**
 * Create an initials block. In a typical signing workflow, the user is asked at the beginning of the process to "adopt"
 * an initials block to be used for all initials fields in the document. Thus, this is typically called one time to
 * create and store an initials block. Thereafter, the ID of the initials block may be re-used for each initials field
 * to be "stamped" by the user.
 *
 * Note: Both "guest" signers and authenticated users can create initials blocks. Guest signers
 * typically only ever have one, tied to that session. But authenticated users can create more than
 * one, and can use them interchangeably.
 *
 * @group Signatures and Initials
 * @api POST /v2/profiles/initials Create Initial Block
 * @apiBody string initial Blob containing initials image to store.
 * @apiSuccess IInitial . The newly-created initial block.
 */
export const createInitials = (endpoint: VerdocsEndpoint, name: string, initials: Blob) => {
  const data = new FormData();
  data.append('initial', initials, name);

  return endpoint.api //
    .post<IInitial>(`/v2/profiles/initials`, data)
    .then((r) => r.data);
};
