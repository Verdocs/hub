import type {
  IInPersonLinkResponse,
  IUpdateRecipientSubmitParams,
  IUpdateRecipientClaimEnvelope,
  IUpdateRecipientAgreedParams,
  IUpdateRecipientNameParams,
  IUpdateRecipientDeclineParams,
  IUpdateRecipientPrepareParams,
} from './Types';
import {IEnvelope, IInPersonAccessKey, IRecipient} from '../Models';
import {VerdocsEndpoint} from '../VerdocsEndpoint';

/**
 * Update a recipient's status block
 */
export const updateRecipient = async (
  endpoint: VerdocsEndpoint,
  envelopeId: string,
  roleName: string,
  params:
    | IUpdateRecipientSubmitParams
    | IUpdateRecipientClaimEnvelope
    | IUpdateRecipientAgreedParams
    | IUpdateRecipientNameParams
    | IUpdateRecipientDeclineParams
    | IUpdateRecipientPrepareParams,
) =>
  endpoint.api //
    .put<IRecipient>(`/envelopes/${envelopeId}/recipients/${roleName}`, params)
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
  envelopeId: string,
  roleName: string,
  email: string,
  fullName: string,
) => updateRecipient(endpoint, envelopeId, roleName, {action: 'owner_update', email, full_name: fullName});

/**
 * Agree to electronic signing.
 */
export const envelopeRecipientAgree = (endpoint: VerdocsEndpoint, envelopeId: string, roleName: string, agreed: boolean) =>
  updateRecipient(endpoint, envelopeId, roleName, {action: 'update', agreed});

/**
 * Change a recipient's name.
 */
export const envelopeRecipientUpdateName = (endpoint: VerdocsEndpoint, envelopeId: string, roleName: string, fullName: string) =>
  updateRecipient(endpoint, envelopeId, roleName, {action: 'update', new_full_name: fullName});

/**
 * Change a recipient's name.
 */
export const envelopeRecipientPrepare = (endpoint: VerdocsEndpoint, envelopeId: string, roleName: string, recipients: IRecipient[]) =>
  updateRecipient(endpoint, envelopeId, roleName, {action: 'prepare', recipients});

export interface ISignerTokenResponse {
  envelope: IEnvelope;
  access_token: string;
}

/**
 * Get a signing session for an Envelope. Note that this should generally be called with a NON-default
 * endpoint.
 */
export const getSigningSession = async (endpoint: VerdocsEndpoint, envelope_id: string, role_name: string, key: string) => {
  return endpoint.api //
    .post<ISignerTokenResponse>(`/v2/sign/start/${envelope_id}/${encodeURIComponent(role_name)}/${key}`)
    .then((r) => {
      endpoint.setToken(r.data.access_token);
      return r.data;
    });
};

/**
 * Get a signing token for in-person signing. Authentication is required. This should be called
 * by the logged-in user who wants to sign.
 */
export const getSignerToken = (endpoint: VerdocsEndpoint, envelope_id: string, role_name: string) =>
  endpoint.api //
    .get<ISignerTokenResponse>(`/envelopes/${envelope_id}/recipients/${encodeURIComponent(role_name)}/signer-token`)
    .then((r) => r.data);

/**
 * Get an in-person signing link.
 */
export const getInPersonLink = (endpoint: VerdocsEndpoint, envelopeId: string, roleName: string) =>
  endpoint.api //
    .get<IInPersonLinkResponse>(`/envelopes/${envelopeId}/recipients/${encodeURIComponent(roleName)}?in_person_link=true`)
    .then((r) => r.data);

/**
 * Send a delegation request.
 */
export const sendDelegate = (endpoint: VerdocsEndpoint, envelopeId: string, roleName: string) =>
  endpoint.api //
    .post<IEnvelope>(`/envelopes/${envelopeId}/recipients/${encodeURIComponent(roleName)}/delegate`)
    .then((r) => r.data);

/**
 * Resend a recipient's invitation.
 */
export const resendInvitation = (endpoint: VerdocsEndpoint, envelopeId: string, roleName: string) =>
  endpoint.api //
    .post(`/envelopes/${envelopeId}/recipients/${encodeURIComponent(roleName)}/resend_invitation`)
    .then((r) => r.data);
