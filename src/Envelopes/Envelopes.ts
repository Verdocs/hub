import {IEnvelope, IEnvelopeDocument, IEnvelopeFieldSettings, IRecipient} from '../Models';
import {ICreateEnvelopeRequest, IEnvelopesSearchResult, IEnvelopesSummary} from './Types';
import {TEnvelopeStatus, TEnvelopeUpdateResult, TRecipientStatus} from '../BaseTypes';
import {ISigningSession, ISigningSessionRequest} from '../Sessions';
import {VerdocsEndpoint} from '../VerdocsEndpoint';
import {decodeAccessTokenBody} from '../Utils';

/**
 * Create an envelope
 *
 * ```typescript
 * import {Envelopes, ICreateEnvelopeRole, ICreateEnvelopeRequest} from '@verdocs/js-sdk/Envelopes';
 *
 * const role1: ICreateEnvelopeRole = {
 *   type: 'signer',
 *   name: 'Seller',
 *   full_name: 'Paige Turner',
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
 *   full_name: 'Will Power',
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
export const createEnvelope = async (endpoint: VerdocsEndpoint, request: ICreateEnvelopeRequest) =>
  endpoint.api //
    .post<IEnvelope>('/envelopes', request)
    .then((r) => r.data);

/**
 * Get a summary of currently active envelopes.
 *
 * ```typescript
 * import {Envelopes} from '@verdocs/js-sdk/Envelopes';
 *
 * const {action_required, completed, waiting_on_others} = await Envelopes.getSummary(VerdocsEndpoint.getDefault());
 * ```
 */
export const getEnvelopesSummary = async (endpoint: VerdocsEndpoint, page: number) =>
  endpoint.api //
    .post<IEnvelopesSummary>('/envelopes/summary', {page})
    .then((r) => r.data);

export interface IEnvelopeSearchParams {
  /** The envelope must have been created via the specified template ID. */
  template_id?: string;
  /** The envelope must match one of the specified statuses. */
  envelope_status?: TEnvelopeStatus[];
  /** At least one of the recipients must match one of the specified statuses. */
  recipient_status?: TRecipientStatus[];
  /** The envelope's name (inherited from the template) must match the specified string. */
  envelope_name?: string;
  /** At least one of the envelope's recipients must match the specified name. */
  recipient_name?: string;
  /** At least one of the envelope's recipients must match the specified email address. */
  recipient_email?: string;
  /** Match against envelope_name, recipient_name, or recipient_email all at once. */
  name?: string;
  /** At least one of the envelope's recipients must match the specified ID. */
  recipient_id?: string;
  /** The date-range in which the envelope was created. Values should be specified in ISO8601 "UTC" format. */
  created_at?: {
    start_time: string;
    end_time: string;
  };
  /**
   * The date-range in which the envelope was last updated. Values should be specified in ISO8601 "UTC" format.
   * Note that any operations that alter the envelope are considered "updates", including status changes (cancellation),
   * recipient actions (opening/signing), etc.
   */
  updated_at?: {
    start_time: string;
    end_time: string;
  };
  /** The date-range in which the envelope was canceled. Values should be specified in ISO8601 "UTC" format. */
  canceled_at?: {
    start_time: string;
    end_time: string;
  };
  /** Perform a "contains" search where any of the attached documents' fields contains the specified value. */
  text_field_value?: string;
  /** Set to true to retrieve only summary records (IEnvelopeSummary). */
  summary?: boolean;
  /** Set to true to retrieve only those envelopes owned by the caller. */
  is_owner?: boolean;
  /** Set to true to retrieve only those envelopes in which the caller is one of the recipients. */
  is_recipient?: boolean;
  /** Whether the recipient has "claimed" the envelope. */
  recipient_claimed?: boolean;
  /** The maximum number of records to return. Should be used in place of `row`. */
  limit?: number;
  /** The page number to return. Page numbers are 0-based. */
  page?: number;
  /** The field to sort the results by. */
  sort_by?: 'created_at' | 'updated_at' | 'envelope_name' | 'canceled_at' | 'envelope_status';
  /** Whether to sort in ascending (default) or descending order. */
  ascending?: boolean;
}

/**
 * Search for envelopes matching various criteria.
 *
 * ```typescript
 * import {Envelopes} from '@verdocs/js-sdk/Envelopes';
 *
 * const {result, page, total} = await Envelopes.search(VerdocsEndpoint.getDefault(), { ... });
 * ```
 */
export const searchEnvelopes = async (endpoint: VerdocsEndpoint, params: IEnvelopeSearchParams) =>
  endpoint.api //
    .post<IEnvelopesSearchResult>('/envelopes/search', params)
    .then((r) => r.data);

export interface ISigningSessionResult {
  recipient: IRecipient;
  session: ISigningSession;
  signerToken: string;
}

/**
 * Get a signing session for an Envelope.
 */
export const getSigningSession = async (endpoint: VerdocsEndpoint, params: ISigningSessionRequest) => {
  window.console.log('[JS_SDK] getSigningSession', params, endpoint.api);
  return endpoint.api //
    .get<IRecipient>(`/envelopes/${params.envelopeId}/recipients/${encodeURIComponent(params.roleId)}/invitation/${params.inviteCode}`)
    .then((r) => {
      // Avoiding a jsonwebtoken dependency here - we don't actually need the whole library
      const signerToken = r.headers?.signer_token || '';
      const session = decodeAccessTokenBody(signerToken) as ISigningSession;

      endpoint.setToken(signerToken);

      return {recipient: r.data, session, signerToken} as ISigningSessionResult;
    });
};

/**
 * Get the list of recipients for an Envelope.
 */
export const getEnvelopeRecipients = async (endpoint: VerdocsEndpoint, envelopeId: string) =>
  endpoint.api //
    .get<IRecipient[]>(`/envelopes/${envelopeId}/recipients`)
    .then((r) => r.data);

/**
 * Get all metadata for an Envelope.
 */
export const getEnvelope = async (endpoint: VerdocsEndpoint, envelopeId: string) =>
  endpoint.api //
    .get<IEnvelope>(`/envelopes/${envelopeId}`)
    .then((r) => r.data);

/**
 * Get an Envelope Document
 */
export const getEnvelopeDocument = async (endpoint: VerdocsEndpoint, envelopeId: string, documentId: string) =>
  endpoint.api //
    .get<IEnvelopeDocument>(`/envelopes/${envelopeId}/envelope_documents/${documentId}`)
    .then((r) => r.data);

/**
 * Get a pre-signed download link for an Envelope Document. This link expires quickly, so it should
 * be accessed immediately and never shared. Content-Disposition will be set to "download".
 */
export const getDocumentDownloadLink = async (endpoint: VerdocsEndpoint, envelopeId: string, documentId: string) =>
  endpoint.api //
    .get<string>(`/envelopes/${envelopeId}/envelope_documents/${documentId}?download=true`)
    .then((r) => r.data);

/**
 * Get a pre-signed preview link for an Envelope Document. This link expires quickly, so it should
 * be accessed immediately and never shared. Content-Disposition will be set to "inline".
 */
export const getDocumentPreviewLink = async (endpoint: VerdocsEndpoint, envelopeId: string, documentId: string) =>
  endpoint.api //
    .get<string>(`/envelopes/${envelopeId}/envelope_documents/${documentId}?preview=true`)
    .then((r) => r.data);

/**
 * Cancel an Envelope.
 */
export const cancelEnvelope = async (endpoint: VerdocsEndpoint, envelopeId: string) =>
  endpoint.api //
    .put<TEnvelopeUpdateResult>(`/envelopes/${envelopeId}`, {action: 'cancel'})
    .then((r) => r.data);

/**
 * Get (binary download) a file attached to an Envelope. It is important to use this method
 * rather than a direct A HREF or similar link to set the authorization headers for the
 * request.
 */
export const getEnvelopeFile = async (endpoint: VerdocsEndpoint, envelopeId: string, documentId: string) =>
  endpoint.api //
    .get(`/envelopes/${envelopeId}/envelope_documents/${documentId}?file=true`, {responseType: 'blob'})
    .then((r) => r.data);

/**
 * Update a Document field. Typically called during the signing process as a Recipient fills in fields.
 */
export const updateEnvelopeField = async (endpoint: VerdocsEndpoint, envelopeId: string, fieldName: string, value: any) =>
  endpoint.api //
    .put<IEnvelopeFieldSettings>(`/envelopes/${envelopeId}/fields/${fieldName}`, value)
    .then((r) => r.data);

/**
 * Update a Document signature field. Signature fields are ID-driven. Call `Document.createSignature()` first to create a
 * signature for a Recipient, then call `Documents.updateDocumentFieldSignature()` to attach it to a field.
 */
export const updateEnvelopeFieldSignature = async (endpoint: VerdocsEndpoint, envelopeId: string, fieldName: string, signatureId: string) =>
  endpoint.api //
    .put<IEnvelopeFieldSettings>(`/envelopes/${envelopeId}/fields/${fieldName}/signature/${signatureId}`)
    .then((r) => r.data);

/**
 * Update a Document signature field. Signature fields are ID-driven. Call `Document.createSignature()` first to create a
 * signature for a Recipient, then call `Documents.updateDocumentFieldSignature()` to attach it to a field.
 */
export const updateEnvelopeFieldInitials = async (endpoint: VerdocsEndpoint, envelopeId: string, fieldName: string, initialId: string) =>
  endpoint.api //
    .put<IEnvelopeFieldSettings>(`/envelopes/${envelopeId}/fields/${fieldName}/initial/${initialId}`)
    .then((r) => r.data);

/**
 * Upload an attachment.
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
 */
export const deleteEnvelopeFieldAttachment = async (
  endpoint: VerdocsEndpoint,
  envelopeId: string,
  fieldName: string,
  file: File,
  onUploadProgress?: (percent: number, loadedBytes: number, totalBytes: number) => void,
) => {
  const formData = new FormData();
  // Omitting file is the trigger here

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
 * Get the attached file for an attachment field (if any)
 */
export const getFieldAttachment = async (endpoint: VerdocsEndpoint, envelopeId: string, fieldName: string) =>
  endpoint.api //
    .get(`/envelopes/${envelopeId}/fields/${fieldName}/document`, {responseType: 'blob'})
    .then((r) => r.data);

/**
 * Get a display URI for a given page in a file attached to an envelope document. These pages are rendered server-side
 * into PNG resources suitable for display in IMG tags although they may be used elsewhere. Note that these are intended
 * for DISPLAY ONLY, are not legally binding documents, and do not contain any encoded metadata from participants.
 */
export const getEnvelopeDocumentPageDisplayUri = async (
  endpoint: VerdocsEndpoint,
  envelopeId: string,
  documentId: string,
  page: number,
  type: 'original' | 'filled' | 'certificate' = 'original',
) =>
  endpoint.api
    .get<string>(`/envelopes/${envelopeId}/envelope_documents/${documentId}/pages/${page}/image?type=${type}`, {timeout: 20000})
    .then((r) => r.data);

const cachedEnvelopes: Record<string, {loaded: number; envelope: IEnvelope}> = {};

/**
 * Wrapper for `getEnvelope()` that limits queries to one every 2 seconds per template ID.
 * This is intended for use in component hierarchies that all rely on the same template
 * to avoid unnecessary repeat server calls.
 */
export const throttledGetEnvelope = (endpoint: VerdocsEndpoint, envelopeId: string) => {
  if (cachedEnvelopes[envelopeId] && cachedEnvelopes[envelopeId].loaded + 2000 < new Date().getTime()) {
    return cachedEnvelopes[envelopeId].envelope;
  }

  return getEnvelope(endpoint, envelopeId).then((envelope) => {
    cachedEnvelopes[envelopeId] = {loaded: new Date().getTime(), envelope};
    return envelope;
  });
};

export interface ITimeRange {
  start: string;
  end: string;
}

// /**
//  * Lists all templates accessible by the caller, with optional filters.
//  *
//  * ```typescript
//  * import {Envelopes} from '@verdocs/js-sdk/Templates';
//  *
//  * await Envelopes.listEnvelopes((VerdocsEndpoint.getDefault(), { name: 'test', sort: 'updated_at' });
//  * ```
//  */
// export const listEnvelopes = (endpoint: VerdocsEndpoint, params?: IListEnvelopesParams) =>
//   endpoint.api //
//     .post<IEnvelopeSummaries>('/envelopes/list', params, {baseURL: endpoint.getBaseURLv2()})
//     .then((r) => r.data);
export interface IListEnvelopesParams {
  view?: 'inbox' | 'sent' | 'action' | 'waiting' | 'completed';
  q?: string;
  status?: string[];
  created_at?: ITimeRange;
  is_owner?: boolean;
  sort_by?: 'name' | 'created_at' | 'updated_at' | 'canceled_at' | 'status';
  template_id?: string;
  ascending?: boolean;
  rows?: number;
  page?: number;
}

/**a
 * Lists all envelopes accessible by the caller, with optional filters.
 *
 * ```typescript
 * import {Envelopes} from '@verdocs/js-sdk/Envelopes';
 *
 * const {totals, envelopes} = await Envelopes.listEnvelopes((VerdocsEndpoint.getDefault(), { q: 'test', sort: 'created_at' });
 * ```
 */
export const listEnvelopes = (endpoint: VerdocsEndpoint, params?: IListEnvelopesParams) =>
  endpoint.api //
    .post<{total: number; rows: number; page: number; envelopes: IEnvelope[]}>('/envelopes/list', params)
    .then((r) => r.data);

/**
 * Get all of the envelopes that were sent using a given template.
 * NOTE: This endpoint will be retired soon. Its response is not paginated and it is typically used only to retrieve
 * "submitted data" for a template. A new endpoint will be introduced to provide this function more directly.
 * @deprecated
 */
export const getEnvelopesByTemplateId = async (endpoint: VerdocsEndpoint, templateId: string) =>
  endpoint.api //
    .get<IEnvelope[]>(`/envelopes?template_id=${templateId}`)
    .then((r) => r.data);
