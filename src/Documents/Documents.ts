import {IDocument, IDocumentsSearchResult, IDocumentsSummary, IRecipient, ISigningSession, ISigningSessionRequest} from './Types';
import {TDocumentUpdateResult, IDocumentFieldSettings} from './Types';
import {decodeAccessTokenBody} from '../Utils/Token';
import {VerdocsEndpoint} from '../VerdocsEndpoint';

/**
 * Get a summary of currently active documents.
 *
 * ```typescript
 * import {Documents} from '@verdocs/js-sdk/Documents';
 *
 * const {action_required, completed, waiting_on_others} = await Documents.getSummary();
 * ```
 */
export const getSummary = async (endpoint: VerdocsEndpoint, page: number) =>
  endpoint.api //
    .post<IDocumentsSummary>('/documents/summary', {page})
    .then((r) => r.data);

/**
 * Search for documents matching various criteria.
 *
 * ```typescript
 * import {Documents} from '@verdocs/js-sdk/Documents';
 *
 * const {result, page, total} = await Documents.search({ ... });
 * ```
 */
export const searchDocuments = async (endpoint: VerdocsEndpoint, params: any) =>
  endpoint.api //
    .post<IDocumentsSearchResult>('/documents/search', params)
    .then((r) => r.data);

export interface ISigningSessionResult {
  recipient: IRecipient;
  session: ISigningSession;
  signerToken: string;
}

/**
 * Get a signing session for a Document.
 */
export const getSigningSession = async (endpoint: VerdocsEndpoint, params: ISigningSessionRequest): Promise<ISigningSessionResult> =>
  endpoint.api //
    .get<IRecipient>(`/documents/${params.documentId}/recipients/${encodeURIComponent(params.roleId)}/invitation/${params.inviteCode}`)
    .then((r) => {
      // Avoiding a jsonwebtoken dependency here - we don't actually need the whole library
      const signerToken = r.headers?.signer_token || '';
      const session = decodeAccessTokenBody(signerToken) as ISigningSession;

      endpoint.setToken(r.headers?.signer_token);

      return {recipient: r.data, session, signerToken};
    });

/**
 * Get the list of recipients for a Document.
 */
export const getDocumentRecipients = async (endpoint: VerdocsEndpoint, documentId: string): Promise<IRecipient[]> =>
  endpoint.api //
    .get<IRecipient[]>(`/documents/${documentId}/recipients`)
    .then((r) => r.data);

/**
 * Get all metadata for a Document.
 */
export const getDocument = async (endpoint: VerdocsEndpoint, documentId: string): Promise<IDocument> =>
  endpoint.api //
    .get<IDocument>(`/documents/${documentId}`)
    .then((r) => r.data);

/**
 * Cancel a Document.
 */
export const cancelDocument = async (endpoint: VerdocsEndpoint, documentId: string): Promise<TDocumentUpdateResult> =>
  endpoint.api //
    .put<IDocument>(`/documents/${documentId}`, {action: 'cancel'})
    .then((r) => r.data);

/**
 * Returns true if the recipient has a pending action. Note that this does not necessarily mean the recipient can act (yet).
 */
export const recipientHasAction = (recipient: IRecipient) => !['submitted', 'canceled', 'declined'].includes(recipient.status);

/**
 * Returns the recipients who still have a pending action. Note that not all of these recipients may be able to act (yet).
 */
export const getRecipientsWithActions = (document: IDocument) => (document?.recipients || []).filter(recipientHasAction);

/**
 * Returns true if the recipient can act.
 */
export const recipientCanAct = (recipient: IRecipient, recipientsWithActions: IRecipient[]) =>
  recipient.sequence === recipientsWithActions?.[0]?.sequence;

/**
 * Returns true if the user can act.
 */
export const userCanAct = (email: string, recipientsWithActions: IRecipient[]) => {
  const recipient = recipientsWithActions.find((r) => r.email === email);
  return recipient && recipient.sequence === recipientsWithActions?.[0]?.sequence;
};

/**
 * Get (binary download) a file attached to a Document.
 */
export const getDocumentFile = async (endpoint: VerdocsEndpoint, documentId: string, envelopeDocumentId: string): Promise<string> =>
  endpoint.api //
    .get<string>(`/documents/${documentId}/envelope_documents/${envelopeDocumentId}?file=true`, {
      responseType: 'arraybuffer',
    })
    .then((r) => Buffer.from(r.data, 'binary').toString('base64'));

/**
 * Update a Document field. Typically called during the signing process as a Recipient fills in fields.
 */
export const updateDocumentField = async (endpoint: VerdocsEndpoint, documentId: string, fieldName: string, value: any) =>
  endpoint.api //
    .put<IDocumentFieldSettings>(`/documents/${documentId}/fields/${fieldName}`, value)
    .then((r) => r.data);

/**
 * Update a Document signature field. Signature fields are ID-driven. Call `Document.createSignature()` first to create a
 * signature for a Recipient, then call `Documents.updateDocumentFieldSignature()` to attach it to a field.
 */
export const updateDocumentFieldSignature = async (endpoint: VerdocsEndpoint, documentId: string, fieldName: string, signatureId: string) =>
  endpoint.api //
    .put<IDocumentFieldSettings>(`/documents/${documentId}/fields/${fieldName}/signature/${signatureId}`)
    .then((r) => r.data);
