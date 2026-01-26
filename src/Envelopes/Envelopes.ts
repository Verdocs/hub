import {IEnvelope, IEnvelopeDocument, IEnvelopeField, IEnvelopeFieldSettings} from '../Models';
import {TEnvelopeUpdateResult} from '../BaseTypes';
import {VerdocsEndpoint} from '../VerdocsEndpoint';
import {TCreateEnvelopeRequest} from './Types';
import axiosRetry from 'axios-retry';

/**
 * Create an envelope
 *
 * ```typescript
 * import {Envelopes, ICreateEnvelopeRole, ICreateEnvelopeRequest} from '@verdocs/js-sdk/Envelopes';
 *
 * const role1: ICreateEnvelopeRole = {
 *   type: 'signer',
 *   name: 'Seller',
 *   first_name: 'Paige',
 *   last_name: 'Turner',
 *   email: 'paige.turner@nomail.com',
 *   phone: '',
 *   sequence: 1,
 *   delegator: false,
 *   message: '',
 * };
 *
 * const role2: ICreateEnvelopeRole = {
 *   type: 'signer',
 *   name: 'Buyer',
 *   first_name: 'Power',
 *   last_name: 'Power',
 *   email: 'will.power@nomail.com',
 *   phone: '',
 *   sequence: 2,
 *   delegator: false,
 *   message: '',
 * };
 *
 * const request: ICreateEnvelopeRequest = {template_id: 'd2338742-f3a1-465b-8592-806587413cc1', name: 'Bill of Sale', roles: [role1, role2]};
 * const {id, recipients} = await Envelopes.createEnvelope(VerdocsEndpoint.getDefault(), request);
 * ```
 *
 * @group Envelopes
 * @api POST /v2/envelopes Create Envelope
 * @apiBody string(format:uuid) template_id If using a template, the ID of the template to copy
 * @apiBody array(items:ICreateEnvelopeRecipientDirectly) recipients A list of recipients to include in the workflow. Must specify one recipient to match each template Role.
 * @apiBody array(items:IEnvelopeDocument) documents? If not using a template, a list of documents to include in the envelope.
 * @apiBody array(items:IEnvelopeField) fields? If not using a template, a list of fields to include in the envelope.
 * @apiBody string name? Override the name of the envelope (defaults to the template name).
 * @apiBody string description? Override the description of the envelope (defaults to the template description).
 * @apiBody boolean no_contact? If set to true, no email or SMS messages will be sent to any recipients.
 * @apiBody integer(min: 0) initial_reminder? Override the template initial-reminder setting in ms.
 * @apiBody integer(min: 0) followup_reminders? Override the template initial-reminder setting in ms.
 * @apiBody string expires_at? If set, the envelope will automatically expire (be canceled) at this date and time. Expirations must be at least 1 day in the future.
 * @apiSuccess IEnvelope . The newly-created envelope.
 */
export const createEnvelope = async (endpoint: VerdocsEndpoint, request: TCreateEnvelopeRequest) =>
  endpoint.api //
    .post<IEnvelope>('/v2/envelopes', request)
    .then((r) => r.data);

/**
 * Get all metadata for an envelope. Note that when called by non-creators (e.g. Recipients)
 * this will return only the **metadata** the caller is allowed to view.
 *
 * @group Envelopes
 * @api GET /v2/envelopes/:id Get envelope details
 * @apiParam string(format: 'uuid') id The ID of the envelope to retrieve.
 * @apiSuccess IEnvelope . The detailed metadata for the envelope requested
 */
export const getEnvelope = async (endpoint: VerdocsEndpoint, envelopeId: string) =>
  endpoint.api //
    .get<IEnvelope>(`/v2/envelopes/${envelopeId}`)
    .then((r) => r.data);

/**
 * Get all metadata for an envelope document. Note that when called by non-creators (e.g. Recipients)
 * this will return only the **metadata** the caller is allowed to view.
 *
 * @group Envelope Documents
 * @api GET /v2/envelope-documents/:id Get envelope document
 * @apiParam string(format: 'uuid') document_id The ID of the document to retrieve.
 * @apiSuccess IEnvelopeDocument . The detailed metadata for the document requested
 */
export const getEnvelopeDocument = async (endpoint: VerdocsEndpoint, documentId: string) =>
  endpoint.api //
    .get<IEnvelopeDocument>(`/v2/envelope-documents/${documentId}`)
    .then((r) => r.data);

/**
 * Download a document directly.
 */
export const downloadEnvelopeDocument = async (endpoint: VerdocsEndpoint, documentId: string) =>
  endpoint.api //
    .get(`/v2/envelope-documents/${documentId}?type=file`, {
      responseType: 'blob',
      'axios-retry': {retries: 5, retryDelay: axiosRetry.linearDelay(3000)},
    })
    .then((r) => r.data);

/**
 * Get an envelope document's metadata, or the document itself. If no "type" parameter is specified,
 * the document metadata is returned. If "type" is set to "file", the document binary content is
 * returned with Content-Type set to the MIME type of the file. If "type" is set to "download", a
 * string download link will be returned. If "type" is set to "preview" a string preview link will
 * be returned. This link expires quickly, so it should be accessed immediately and never shared.
 *
 * @group Envelope Documents
 * @api GET /v2/envelope-documents/:document_id Preview, Download, or Link to a Document
 * @apiParam string(format: 'uuid') document_id The ID of the document to retrieve.
 * @apiQuery string(enum:'file'|'download'|'preview') type? Download the file directly, generate a download link, or generate a preview link.
 * @apiSuccess string . The generated link.
 */
export const getEnvelopeDocumentDownloadLink = async (endpoint: VerdocsEndpoint, documentId: string) =>
  endpoint.api //
    .get<string>(`/v2/envelope-documents/${documentId}?type=download`, {
      'axios-retry': {retries: 5, retryDelay: axiosRetry.linearDelay(3000)},
    })
    .then((r) => r.data);

/**
 * Get a pre-signed preview link for an Envelope Document. This link expires quickly, so it should
 * be accessed immediately and never shared. Content-Disposition will be set to "inline".
 */
export const getEnvelopeDocumentPreviewLink = async (endpoint: VerdocsEndpoint, documentId: string) =>
  endpoint.api //
    .get<string>(`/v2/envelope-documents/${documentId}?type=preview`, {
      'axios-retry': {retries: 5, retryDelay: axiosRetry.linearDelay(3000)},
    })
    .then((r) => r.data);

/**
 * Cancel an Envelope.
 *
 * @group Envelopes
 * @api PUT /v2/envelopes/:id Cancel envelope
 * @apiParam string(format: 'uuid') id The ID of the envelope to cancel.
 * @apiBody string(enum: 'cancel') action The action to perform (currently only "cancel" is supported).
 * @apiSuccess IEnvelope . The updated envelope.
 */
export const cancelEnvelope = async (endpoint: VerdocsEndpoint, envelopeId: string) =>
  endpoint.api //
    .put<TEnvelopeUpdateResult>(`/v2/envelopes/${envelopeId}`, {action: 'cancel'})
    .then((r) => r.data);

/**
 * Get (binary download) a file attached to an Envelope. It is important to use this method
 * rather than a direct A HREF or similar link to set the authorization headers for the
 * request.
 *
 * @deprecated Use getDocumentPreviewLink/getDocumentDownloadLink/downloadDocument instead.
 */
export const getEnvelopeFile = async (endpoint: VerdocsEndpoint, documentId: string) =>
  endpoint.api //
    .get(`/v2/envelope-documents/${documentId}?type=file`, {responseType: 'blob'})
    .then((r) => r.data);

/**
 * Update an envelope. Currently, only reminder settings may be changed.
 *
 * @group Envelopes
 * @api PATCH /v2/envelopes/:id Update Envelope
 * @apiParam string(format: 'uuid') id The ID of the envelope to update.
 * @apiBody string name? New name for the envelope
 * @apiBody string sender_name? New Sender Name for the envelope
 * @apiBody string sender_email? New Sender Email for the envelope
 * @apiBody integer(min: 0) initial_reminder? Change the initial-reminder setting (in ms).
 * @apiBody integer(min: 0) followup_reminders? Change the followup-reminder setting (in ms).
 * @apiBody string expires_at? If set, the envelope will automatically expire (be canceled) at this date and time. Expirations must be at least 1 day in the future.
 * @apiBody string(enum:'private'|'shared') visibility? Change the envelope's visibility setting
 * @apiBody boolean no_contact? If set to true, no email or SMS messages will be sent to any recipients.
 * @apiBody object data? Update the developer-supplied metadata attached to the envelope.
 * @apiSuccess IEnvelope . A copy of the newly-updated envelope.
 */
export const updateEnvelope = async (
  endpoint: VerdocsEndpoint,
  envelopeId: string,
  params: Partial<
    Pick<
      IEnvelope,
      | 'name'
      | 'sender_name'
      | 'sender_email'
      | 'initial_reminder'
      | 'followup_reminders'
      | 'expires_at'
      | 'visibility'
      | 'no_contact'
      | 'data'
    >
  >,
) =>
  endpoint.api //
    .patch<IEnvelope>(`/v2/envelopes/${envelopeId}`, params)
    .then((r) => r.data);

/**
 * Update an Envelope field. Typically called during the signing process as a Recipient fills in fields.
 *
 * @group Envelopes
 * @api PUT /v2/envelopes/:envelope_id/fields/:field_name Update Envelope Field
 * @apiParam string(format: 'uuid') envelope_id The ID of the envelope to retrieve.
 * @apiParam string role_name The role to submit. Be sure to URL-encode the value.
 * @apiParam string field_name The name of the field to update. Be sure to URL-encode the value.
 * @apiParam string value The value to set. For signature/initial fields, the UUID of the signature/initial block. For attachment fields, a file uploaded in a FORM-POST field named "document". For checkbox/radio buttons, a boolean. For all other fields, a string.
 * @apiBody string value Value to set.
 * @apiSuccess IEnvelopeField . A copy of the newly-updated field.
 */
export const updateEnvelopeField = async (
  endpoint: VerdocsEndpoint,
  envelopeId: string,
  roleName: string,
  fieldName: string,
  value: string,
  prepared: boolean,
) =>
  endpoint.api //
    .put<IEnvelopeField>(`/v2/envelopes/${envelopeId}/recipients/${roleName}/fields/${fieldName}`, {value, prepared})
    .then((r) => r.data);

/**
 * Upload an attachment to an attachment field.
 */
export const uploadEnvelopeFieldAttachment = async (
  endpoint: VerdocsEndpoint,
  envelopeId: string,
  roleName: string,
  fieldName: string,
  file: File,
  onUploadProgress?: (percent: number, loadedBytes: number, totalBytes: number) => void,
) => {
  const formData = new FormData();
  formData.append('document', file, file.name);
  formData.append('value', '');

  return endpoint.api //
    .put<IEnvelopeFieldSettings>(`/v2/envelopes/${envelopeId}/recipients/${roleName}/fields/${fieldName}`, formData, {
      timeout: 120000,
      onUploadProgress: (event) => {
        const total = event.total || 1;
        const loaded = event.loaded || 0;
        onUploadProgress?.(Math.floor((loaded * 100) / (total || 1)), loaded, total || 1);
      },
    })
    .then((r) => r.data);
};

/**
 * Delete an attachment. Note that this is not a DELETE endpoint because the field itself is not
 * being deleted. Instead, it is a similar operation to uploading a new attachment, but the
 * omission of the attachment signals the server to delete the current entry.
 */
export const deleteEnvelopeFieldAttachment = async (endpoint: VerdocsEndpoint, envelopeId: string, roleName: string, fieldName: string) => {
  const formData = new FormData();
  // Omitting file is the trigger here

  return endpoint.api //
    .put<IEnvelopeFieldSettings>(`/v2/envelopes/${envelopeId}/recipients/${roleName}/fields/${fieldName}`, formData)
    .then((r) => r.data);
};

/**
 * Get a display URI for a given page in a file attached to an envelope document. These pages are rendered server-side
 * into PNG resources suitable for display in IMG tags although they may be used elsewhere. Note that these are intended
 * for DISPLAY ONLY, are not legally binding documents, and do not contain any encoded metadata from participants.
 *
 * @group Envelopes
 * @api GET /v2/envelope-documnets/page-image/:document_id/:variant/:page Get envelope document page display URI
 * @apiParam string(format: 'uuid') document_id The ID of the document to retrieve.
 * @apiParam string(enum: 'original'|'filled') variant The variant of the document to retrieve.
 * @apiParam integer page The page number to retrieve
 * @apiSuccess string . The page display URI. Note that this is a signed URL with a short expiration. It should be used immediately and never databased or cached.
 */
export const getEnvelopeDocumentPageDisplayUri = async (
  endpoint: VerdocsEndpoint,
  documentId: string,
  page: number,
  variant: 'original' | 'filled' | 'certificate' = 'original',
) => endpoint.api.get<string>(`/v2/envelope-documents/page-image/${documentId}/${variant}/${page}`, {timeout: 20000}).then((r) => r.data);

export interface ITimeRange {
  start: string;
  end: string;
}

export interface IListEnvelopesParams {
  q?: string;
  view?: 'inbox' | 'sent' | 'action' | 'waiting' | 'completed';
  status?: ('complete' | 'pending' | 'in progress' | 'declined' | 'canceled')[];
  include_org?: boolean;
  template_id?: string;
  created_before?: string;
  created_after?: string;
  sort_by?: 'name' | 'created_at' | 'updated_at' | 'canceled_at' | 'status';
  ascending?: boolean;
  rows?: number;
  page?: number;
}

/**
 * Lists all envelopes accessible by the caller, with optional filters.
 *
 * ```typescript
 * import {getEnvelopes} from '@verdocs/js-sdk/Envelopes';
 *
 * const {count, envelopes} = await getEnvelopes((VerdocsEndpoint.getDefault(), { q: 'test' });
 * ```
 *
 * @group Envelopes
 * @api GET /v2/envelopes List envelopes
 * @apiQuery string q? Match envelopes whose name contains this string
 * @apiQuery string(enum: 'inbox' | 'sent' | 'action' | 'waiting' | 'completed') view? Request pre-defined view. `inbox` returns envelopes where action is required by the caller. `sent` returns envelopes created by the caller. `action` returns envelopes where action is required by the caller. `waiting` returns envelopes where action is required by anyone. `completed` returns envelopes where all actions are complete.
 * @apiQuery array(items: 'complete' | 'pending' | 'in progress' | 'declined' | 'canceled') status? Match envelopes in one of the specified states.
 * @apiQuery boolean(default: false) include_org? If true, include organizations-shared envelopes
 * @apiQuery string(format: uuid) template_id? Match envelopes created from the specified template ID
 * @apiQuery string(format: date-time) created_before? Match envelopes created before this date
 * @apiQuery string(format: date-time) created_after? Match envelopes created after this date
 * @apiQuery string(enum: 'name' | 'created_at' | 'updated_at' | 'canceled_at' | 'status') sort_by? Return results sorted by this criteria
 * @apiQuery boolean ascending? Set true/false to override the sort direction. Note that the default depends on `sort_by`. Date-based sorts default to descending, while name and status default to ascending.
 * @apiQuery integer(default: 20) rows? Limit the number of rows returned
 * @apiQuery integer(default: 0) page? Specify which page of results to return
 * @apiSuccess integer(format: int32) count The total number of records matching the query, helpful for pagination
 * @apiSuccess integer(format: int32) rows The number of rows returned in this response page
 * @apiSuccess integer(format: int32) page The page number of this response
 * @apiSuccess array(items: IEnvelope) envelopes List of envelopes found
 */
export const getEnvelopes = (endpoint: VerdocsEndpoint, params?: IListEnvelopesParams) =>
  endpoint.api //
    .get<{count: number; rows: number; page: number; envelopes: IEnvelope[]}>('/v2/envelopes', {params})
    .then((r) => r.data);

/**
 * Generate a ZIP file containing all data for the specified envelopes. The caller must be the
 * owner of each envelope. The returned ZIP file contains a folder for each envelope.
 */
export const getEnvelopesZip = (endpoint: VerdocsEndpoint, envelope_ids: string[]) =>
  endpoint.api //
    .get(`/v2/envelopes/zip/${envelope_ids.join(',')}`, {responseType: 'blob', timeout: 120000});

/**
 * Utility function to sort fields by page, then by Y coordinate, then by X coordinate.
 * NOTE: This function mutates the input array.
 */
export function sortFields(
  fields: {
    page?: number | null | undefined;
    x?: number | null | undefined;
    y?: number | null | undefined;
    height?: number | null | undefined;
  }[],
) {
  fields.sort((a, b) => {
    const aPage = a.page || 0;
    const bPage = b.page || 0;
    const aX = a.x || 0;
    const aY = (a.y || 0) + (a.height || 0);
    const bX = b.x || 0;
    const bY = (b.y || 0) + (b.height || 0);

    if (aPage !== bPage) {
      return aPage - bPage;
    }

    // NOTE: Logic looks a little strange X vs Y. It's because we go top down,
    // left to right. But Y coordinates are inverted in PDFs. The reason for
    // the division is because no human makes perfect templates and frequently
    // two fields on the "same line" will be slightly offset vertically.
    const divaY = Math.floor(aY / 5);
    const divbY = Math.floor(bY / 5);
    if (divaY !== divbY) {
      return divbY - divaY;
    }

    return aX - bX;
  });

  return fields;
}

/**
 * Utility function to sort documents by their order, falling back to created_at.
 * NOTE: This function mutates the input array.
 */
export function sortDocuments(documents: {order: number; created_at: Date | string}[]) {
  return documents.sort((a, b) =>
    // The Date conversion is unnecessary 90% of the time but is safer, and this isn't something
    // we do much of so in reality it has almmost no impact.
    a.order !== b.order ? a.order - b.order : new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
}

/**
 * Utility function to sort documents by their order, falling back to created_at.
 * NOTE: This function mutates the input array.
 */
export function sortRecipients(recipients?: {sequence: number; order: number}[]) {
  return recipients?.sort((a, b) => (a.sequence !== b.sequence ? b.sequence - a.sequence : b.order - a.order));
}
