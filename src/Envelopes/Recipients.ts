import type {
  IInPersonLinkResponse,
  IUpdateRecipientSubmitParams,
  IUpdateRecipientClaimEnvelope,
  IUpdateRecipientAgreedParams,
  IUpdateRecipientNameParams,
  IUpdateRecipientDeclineParams,
  IUpdateRecipientPrepareParams,
  ISignerTokenResponse,
} from './Types';
import {IEnvelope, IRecipient} from '../Models';
import {VerdocsEndpoint} from '../VerdocsEndpoint';

/**
 * Update a recipient's status block
 */
export const updateRecipient = async (
  endpoint: VerdocsEndpoint,
  envelope_id: string,
  role_name: string,
  params:
    | IUpdateRecipientSubmitParams
    | IUpdateRecipientClaimEnvelope
    | IUpdateRecipientAgreedParams
    | IUpdateRecipientNameParams
    | IUpdateRecipientDeclineParams
    | IUpdateRecipientPrepareParams,
) =>
  endpoint.api //
    .put<IRecipient>(`/envelopes/${envelope_id}/recipients/${role_name}`, params)
    .then((r) => r.data);

/**
 * Submit an envelope (signing is finished). Note that all fields must be valid/completed for this to succeed.
 */
export const envelopeRecipientSubmit = (endpoint: VerdocsEndpoint, envelopeId: string, roleName: string) =>
  updateRecipient(endpoint, envelopeId, roleName, {action: 'submit'});

/**
 * Decline to complete an envelope (signing will not terminated).
 */
export const envelopeRecipientDecline = (endpoint: VerdocsEndpoint, envelopeId: string, roleName: string) =>
  updateRecipient(endpoint, envelopeId, roleName, {action: 'decline'});

/**
 * Claim / change ownership of an envelope. This is a special-case operation only available in certain workflows.
 */
export const envelopeRecipientChangeOwner = (
  endpoint: VerdocsEndpoint,
  envelope_id: string,
  role_name: string,
  email: string,
  first_name: string,
  last_name: string,
) => updateRecipient(endpoint, envelope_id, role_name, {action: 'owner_update', email, first_name, last_name});

/**
 * Agree to electronic signing.
 */
export const envelopeRecipientAgree = (endpoint: VerdocsEndpoint, envelopeId: string, roleName: string, agreed: boolean) =>
  updateRecipient(endpoint, envelopeId, roleName, {action: 'update', agreed});

/**
 * Change a recipient's name.
 */
export const envelopeRecipientUpdateName = (
  endpoint: VerdocsEndpoint,
  envelopeId: string,
  roleName: string,
  first_name: string,
  last_name: string,
) => updateRecipient(endpoint, envelopeId, roleName, {action: 'update', first_name, last_name});

/**
 * Change a recipient's name.
 */
export const envelopeRecipientPrepare = (endpoint: VerdocsEndpoint, envelopeId: string, roleName: string, recipients: IRecipient[]) =>
  updateRecipient(endpoint, envelopeId, roleName, {action: 'prepare', recipients});

/**
 * Begin a signing session for an Envelope. This path requires an invite code, and should generally
 * be called with a NON-default endpoint to avoid conflicting with any active user session the user
 * may have. To initiate in-person signing by an authenticated user (e.g. self-signing), call
 * getInPersonLink() instead. The response from that call includes both a link for direct signing
 * via a Web browser as well as an in-person access_key. That access_key.key may be used here as well.
 */
export const startSigningSession = async (endpoint: VerdocsEndpoint, envelope_id: string, role_name: string, key: string) => {
  return endpoint.api //
    .post<ISignerTokenResponse>(`/v2/sign/unauth/${envelope_id}/${encodeURIComponent(role_name)}/${key}`)
    .then((r) => {
      endpoint.setToken(r.data.access_token, 'signing');
      return r.data;
    });
};

/**
 * Get an in-person signing link.
 */
export const getInPersonLink = (endpoint: VerdocsEndpoint, envelope_id: string, role_name: string) =>
  endpoint.api //
    .post<IInPersonLinkResponse>(`/v2/sign/in-person/${envelope_id}/${encodeURIComponent(role_name)}`)
    .then((r) => r.data);

/**
 * Send a delegation request.
 */
export const sendDelegate = (endpoint: VerdocsEndpoint, envelopeId: string, roleName: string) =>
  endpoint.api //
    .post<IEnvelope>(`/envelopes/${envelopeId}/recipients/${encodeURIComponent(roleName)}`)
    .then((r) => r.data);

/**
 * Resend a recipient's invitation.
 */
export const resendInvitation = (endpoint: VerdocsEndpoint, envelopeId: string, roleName: string) =>
  endpoint.api //
    .put(`/v2/envelopes/${envelopeId}/recipients/${encodeURIComponent(roleName)}`, {action: 'resend'})
    .then((r) => r.data);
