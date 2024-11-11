import {IEnvelope, IEnvelopeDocument, IEnvelopeFieldSettings} from '../Models';
import {TEnvelopeUpdateResult} from '../BaseTypes';
import {VerdocsEndpoint} from '../VerdocsEndpoint';
import {TCreateEnvelopeRequest} from './Types';

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
 */
export const createEnvelope = async (endpoint: VerdocsEndpoint, request: TCreateEnvelopeRequest) =>
  endpoint.api //
    .post<IEnvelope>('/v2/envelopes', request)
    .then((r) => r.data);

/**
 * Get all metadata for an envelope. Note that when called by non-creators (e.g. Recipients)
 * this will return only the **metadata** the caller is allowed to view.
 * [Account capabilities](https://stripe.com/docs/connect/account-capabilities)
 *
 * @group Envelopes
 * @api GET /v2/envelopes/:id Get Envelope Details
 * @apiParam string(format: 'uuid') id The ID of the envelope to retrieve.
 * @apiSuccess IEnvelope . The detailed metadata for the envelope requested
 */
export const getEnvelope = async (endpoint: VerdocsEndpoint, envelopeId: string) =>
  endpoint.api //
    .get<IEnvelope>(`/v2/envelopes/${envelopeId}`)
    .then((r) => r.data);

/**
 * Get an Envelope Document
 *
 * @group Envelopes
 * @api GET /v2/envelopes/:id Get Envelope Details
 * @apiParam string(format: 'uuid') id The ID of the envelope to retrieve.
 * @apiSuccess IEnvelopeDocument . The detailed metadata for the envelope requested
 */
export const getEnvelopeDocument = async (endpoint: VerdocsEndpoint, envelopeId: string, documentId: string) =>
  endpoint.api //
    .get<IEnvelopeDocument>(`/envelopes/${envelopeId}/envelope_documents/${documentId}`)
    .then((r) => r.data);

/**
 * Get a pre-signed download link for an Envelope Document. This link expires quickly, so it should
 * be accessed immediately and never shared. Content-Disposition will be set to "download".
 *
 * @group Envelopes
 * @api GET /v2/envelopes/:id Get Envelope Details
 * @apiParam string(format: 'uuid') id The ID of the envelope to retrieve.
 */
export const getDocumentDownloadLink = async (endpoint: VerdocsEndpoint, envelopeId: string, documentId: string) =>
  endpoint.api //
    .get<string>(`/envelopes/${envelopeId}/envelope_documents/${documentId}?download=true`)
    .then((r) => r.data);

/**
 * Get a pre-signed preview link for an Envelope Document. This link expires quickly, so it should
 * be accessed immediately and never shared. Content-Disposition will be set to "inline".
 *
 * @group Envelopes
 * @api GET /v2/envelopes/:id Get Envelope Details
 * @apiParam string(format: 'uuid') id The ID of the envelope to retrieve.
 */
export const getDocumentPreviewLink = async (endpoint: VerdocsEndpoint, envelopeId: string, documentId: string) =>
  endpoint.api //
    .get<string>(`/envelopes/${envelopeId}/envelope_documents/${documentId}?preview=true`)
    .then((r) => r.data);

/**
 * Cancel an Envelope.
 *
 * @group Envelopes
 * @api GET /v2/envelopes/:id Get Envelope Details
 * @apiParam string(format: 'uuid') id The ID of the envelope to retrieve.
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
 * @group Envelopes
 * @api GET /v2/envelopes/:id Get Envelope Details
 * @apiParam string(format: 'uuid') id The ID of the envelope to retrieve.
 */
export const getEnvelopeFile = async (endpoint: VerdocsEndpoint, envelopeId: string, documentId: string) =>
  endpoint.api //
    .get(`/envelopes/${envelopeId}/envelope_documents/${documentId}?file=true`, {responseType: 'blob'})
    .then((r) => r.data);

/**
 * Update an envelope. Currently, only reminder settings may be changed.
 *
 * @group Envelopes
 * @api GET /v2/envelopes/:id Get Envelope Details
 * @apiParam string(format: 'uuid') id The ID of the envelope to retrieve.
 * @apiSuccess IEnvelope . A copy of the newly-updated envelope.
 */
export const updateEnvelope = async (
  endpoint: VerdocsEndpoint,
  envelopeId: string,
  params: Pick<IEnvelope, 'initial_reminder' | 'followup_reminders'>,
) =>
  endpoint.api //
    .patch<IEnvelope>(`/v2/envelopes/${envelopeId}`, params)
    .then((r) => r.data);

/**
 * Update a Document field. Typically called during the signing process as a Recipient fills in fields.
 *
 * @group Envelopes
 * @api GET /v2/envelopes/:id Get Envelope Details
 * @apiParam string(format: 'uuid') id The ID of the envelope to retrieve.
 */
export const updateEnvelopeField = async (endpoint: VerdocsEndpoint, envelopeId: string, fieldName: string, value: any) =>
  endpoint.api //
    .put<IEnvelopeFieldSettings>(`/envelopes/${envelopeId}/fields/${fieldName}`, value)
    .then((r) => r.data);

/**
 * Update a Document signature field. Signature fields are ID-driven. Call `Document.createSignature()` first to create a
 * signature for a Recipient, then call `Documents.updateDocumentFieldSignature()` to attach it to a field.
 *
 * @group Envelopes
 * @api GET /v2/envelopes/:id Get Envelope Details
 * @apiParam string(format: 'uuid') id The ID of the envelope to retrieve.
 */
export const updateEnvelopeFieldSignature = async (endpoint: VerdocsEndpoint, envelopeId: string, fieldName: string, signatureId: string) =>
  endpoint.api //
    .put<IEnvelopeFieldSettings>(`/envelopes/${envelopeId}/fields/${fieldName}/signature/${signatureId}`)
    .then((r) => r.data);

/**
 * Update a Document signature field. Signature fields are ID-driven. Call `Document.createSignature()` first to create a
 * signature for a Recipient, then call `Documents.updateDocumentFieldSignature()` to attach it to a field.
 *
 * @group Envelopes
 * @api GET /v2/envelopes/:id Get Envelope Details
 * @apiParam string(format: 'uuid') id The ID of the envelope to retrieve.
 */
export const updateEnvelopeFieldInitials = async (endpoint: VerdocsEndpoint, envelopeId: string, fieldName: string, initialId: string) =>
  endpoint.api //
    .put<IEnvelopeFieldSettings>(`/envelopes/${envelopeId}/fields/${fieldName}/initial/${initialId}`)
    .then((r) => r.data);

/**
 * Upload an attachment.
 *
 * @group Envelopes
 * @api GET /v2/envelopes/:id Get Envelope Details
 * @apiParam string(format: 'uuid') id The ID of the envelope to retrieve.
 */
export const uploadEnvelopeFieldAttachment = async (
  endpoint: VerdocsEndpoint,
  envelopeId: string,
  fieldName: string,
  file: File,
  onUploadProgress?: (percent: number, loadedBytes: number, totalBytes: number) => void,
) => {
  const formData = new FormData();
  formData.append('document', file, file.name);

  return endpoint.api //
    .put<IEnvelopeFieldSettings>(`/envelopes/${envelopeId}/fields/${fieldName}`, formData, {
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
 * Delete an attachment.
 *
 * @group Envelopes
 * @api GET /v2/envelopes/:id Get Envelope Details
 * @apiParam string(format: 'uuid') id The ID of the envelope to retrieve.
 */
export const deleteEnvelopeFieldAttachment = async (endpoint: VerdocsEndpoint, envelopeId: string, fieldName: string) => {
  const formData = new FormData();
  // Omitting file is the trigger here

  return endpoint.api //
    .put<IEnvelopeFieldSettings>(`/envelopes/${envelopeId}/fields/${fieldName}`, formData)
    .then((r) => r.data);
};

/**
 * Get the attached file for an attachment field (if any).
 *
 * @group Envelopes
 * @api GET /v2/envelopes/:id Get Envelope Details
 * @apiParam string(format: 'uuid') id The ID of the envelope to retrieve.
 */
export const getFieldAttachment = async (endpoint: VerdocsEndpoint, envelopeId: string, fieldName: string) =>
  endpoint.api //
    .get(`/envelopes/${envelopeId}/fields/${fieldName}/document`, {responseType: 'blob'})
    .then((r) => r.data);

/**
 * Get a display URI for a given page in a file attached to an envelope document. These pages are rendered server-side
 * into PNG resources suitable for display in IMG tags although they may be used elsewhere. Note that these are intended
 * for DISPLAY ONLY, are not legally binding documents, and do not contain any encoded metadata from participants.
 *
 * @group Envelopes
 * @api GET /v2/envelopes/:id Get Envelope Details
 * @apiParam string(format: 'uuid') id The ID of the envelope to retrieve.
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
 * @api GET /v2/envelopes List Envelopes
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
 * @apiSuccess integer count The total number of records matching the query, helpful for pagination
 * @apiSuccess integer rows The number of rows returned in this response page
 * @apiSuccess integer page The page number of this response
 * @apiSuccess array(items: IEnvelope) List of envelopes found
 */
export const getEnvelopes = (endpoint: VerdocsEndpoint, params?: IListEnvelopesParams) =>
  endpoint.api //
    .get<{count: number; rows: number; page: number; envelopes: IEnvelope[]}>('/v2/envelopes', {params})
    .then((r) => r.data);
