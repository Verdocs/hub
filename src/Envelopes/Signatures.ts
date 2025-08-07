import {VerdocsEndpoint} from '../VerdocsEndpoint';
import {ISignature} from '../Models';

/**
 * Create a signature block. In a typical signing workflow, the user is asked at the beginning of the process to "adopt"
 * a signature block to be used for all signature fields in the document. Thus, this is typically called one time to
 * create and store a signature block. Thereafter, the ID of the signature block may be re-used for each signature field
 * to be "stamped" by the user.
 *
 * Note: Both "guest" signers and authenticated users can create initials blocks. Guest signers
 * typically only ever have one, tied to that session. But authenticated users can create more than
 * one, and can use them interchangeably.
 *
 * @group Signatures and Initials
 * @api POST /v2/profiles/signatures Create Signature Block
 * @apiBody string signature Blob containing signature image to store.
 * @apiSuccess ISignature . The newly-created signature block.
 */
export const createSignature = (endpoint: VerdocsEndpoint, name: string, signature: Blob) => {
  const data = new FormData();
  data.append('signature', signature, name);

  return endpoint.api //
    .post<ISignature>(`/v2/profiles/signatures`, data)
    .then((r) => r.data);
};

/**
 * Get the available signatures for a user.
 *
 * @group Signatures and Initials
 * @api GET /signatures Create Signature Block
 *
 * @apiSuccess array(items:ISignature) . A list of signatures previously stored for the user.
 */
export const getSignatures = (endpoint: VerdocsEndpoint) =>
  endpoint.api //
    .get<ISignature[]>('/signatures')
    .then((r) => r.data);

/**
 * Get a user's signature by ID.
 *
 * @group Signatures and Initials
 * @api GET /signatures/:id Delete Signature Block
 * @apiParam string(format: 'uuid') id The ID of the signature to delete.
 * @apiSuccess ISignature . The signature metadata requested.
 */
export const getSignature = (endpoint: VerdocsEndpoint, signatureId: string) =>
  endpoint.api //
    .get(`/signatures/${signatureId}`)
    .then((r) => r.data);

/**
 * Delete a user's signature.
 *
 * @group Signatures and Initials
 * @api DELETE /signatures/:id Delete Signature Block
 * @apiParam string(format: 'uuid') id The ID of the signature to delete.
 * @apiSuccess string . OK
 */
export const deleteSignature = (endpoint: VerdocsEndpoint, signatureId: string) =>
  endpoint.api //
    .delete(`/signatures/${signatureId}`)
    .then((r) => r.data);
