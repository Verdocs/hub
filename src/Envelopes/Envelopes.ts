import {
  IEnvelope,
  IEnvelopesSummary,
  IRecipient,
  ISigningSession,
  TEnvelopeUpdateResult,
  IDocumentFieldSettings,
  IEnvelopeDocument,
} from './Types';
import {ICreateEnvelopeRole, IEnvelopesSearchResult, ISigningSessionRequest} from './Types';
import {decodeAccessTokenBody} from '../Utils/Token';
import {VerdocsEndpoint} from '../VerdocsEndpoint';

export interface ICreateEnvelopeRequest {
  template_id: string;
  roles: ICreateEnvelopeRole[];
  name: string;
}

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
export const getSummary = async (endpoint: VerdocsEndpoint, page: number) =>
  endpoint.api //
    .post<IEnvelopesSummary>('/envelopes/summary', {page})
    .then((r) => r.data);

/**
 * Search for envelopes matching various criteria.
 *
 * ```typescript
 * import {Envelopes} from '@verdocs/js-sdk/Envelopes';
 *
 * const {result, page, total} = await Envelopes.search(VerdocsEndpoint.getDefault(), { ... });
 * ```
 */
export const searchEnvelopes = async (endpoint: VerdocsEndpoint, params: any) =>
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
export const getSigningSession = async (endpoint: VerdocsEndpoint, params: ISigningSessionRequest) =>
  endpoint.api //
    .get<IRecipient>(`/envelopes/${params.envelopeId}/recipients/${encodeURIComponent(params.roleId)}/invitation/${params.inviteCode}`)
    .then((r) => {
      // Avoiding a jsonwebtoken dependency here - we don't actually need the whole library
      const signerToken = r.headers?.signer_token || '';
      const session = decodeAccessTokenBody(signerToken) as ISigningSession;

      endpoint.setToken(signerToken);

      return {recipient: r.data, session, signerToken} as ISigningSessionResult;
    });

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
export const getEnvelope = async (endpoint: VerdocsEndpoint, envelopeId: string, ssr?: boolean) =>
  endpoint.api //
    .get<IEnvelope>(`/envelopes/${envelopeId}` + (ssr ? '?ssr=true' : ''))
    .then((r) => r.data);

/**
 * Get all metadata for an Envelope.
 */
export const getEnvelopeDocument = async (endpoint: VerdocsEndpoint, envelopeId: string, documentId: string) =>
  endpoint.api //
    .get<IEnvelopeDocument>(`/envelopes/${envelopeId}/envelope_documents/${documentId}`)
    .then((r) => r.data);

/**
 * Cancel an Envelope.
 */
export const cancelEnvelope = async (endpoint: VerdocsEndpoint, envelopeId: string) =>
  endpoint.api //
    .put<TEnvelopeUpdateResult>(`/envelopes/${envelopeId}`, {action: 'cancel'})
    .then((r) => r.data);

/**
 * Returns true if the recipient has a pending action. Note that this does not necessarily mean the recipient can act (yet).
 */
export const recipientHasAction = (recipient: IRecipient) => !['submitted', 'canceled', 'declined'].includes(recipient.status);

/**
 * Returns the recipients who still have a pending action. Note that not all of these recipients may be able to act (yet).
 */
export const getRecipientsWithActions = (envelope: IEnvelope) => (envelope?.recipients || []).filter(recipientHasAction);

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
 * Get (binary download) a file attached to an Envelope. It is important to use this method
 * rather than a direct A HREF or similar link to set the authorization headers for the
 * request.
 */
export const getEnvelopeFile = async (endpoint: VerdocsEndpoint, envelopeId: string, documentId: string): Promise<string> =>
  endpoint.api //
    .get<string>(`/envelopes/${envelopeId}/envelope_documents/${documentId}?file=true`, {
      responseType: 'arraybuffer',
    })
    .then((r) => Buffer.from(r.data, 'binary').toString('base64'));

/**
 * Update a Document field. Typically called during the signing process as a Recipient fills in fields.
 */
export const updateEnvelopeField = async (endpoint: VerdocsEndpoint, envelopeId: string, fieldName: string, value: any) =>
  endpoint.api //
    .put<IDocumentFieldSettings>(`/envelopes/${envelopeId}/fields/${fieldName}`, value)
    .then((r) => r.data);

/**
 * Update a Document signature field. Signature fields are ID-driven. Call `Document.createSignature()` first to create a
 * signature for a Recipient, then call `Documents.updateDocumentFieldSignature()` to attach it to a field.
 */
export const updateEnvelopeFieldSignature = async (endpoint: VerdocsEndpoint, envelopeId: string, fieldName: string, signatureId: string) =>
  endpoint.api //
    .put<IDocumentFieldSettings>(`/envelopes/${envelopeId}/fields/${fieldName}/signature/${signatureId}`)
    .then((r) => r.data);

/**
 * Update a Document signature field. Signature fields are ID-driven. Call `Document.createSignature()` first to create a
 * signature for a Recipient, then call `Documents.updateDocumentFieldSignature()` to attach it to a field.
 */
export const updateEnvelopeFieldInitials = async (endpoint: VerdocsEndpoint, envelopeId: string, fieldName: string, initialId: string) =>
  endpoint.api //
    .put<IDocumentFieldSettings>(`/envelopes/${envelopeId}/fields/${fieldName}/initial/${initialId}`)
    .then((r) => r.data);
