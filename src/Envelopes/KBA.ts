import {VerdocsEndpoint} from '../VerdocsEndpoint';

/**
 * KBA is not required at this time. Note that if there is a discrepancy between the `kba_required`
 * field here and that in the Recipient object, this object should be considered authoritative
 * (this can happen if the envelope sender updates the setting after the recipient has already
 * been invited).
 */
export interface IRecipientKbaStatusNotRequired {
  envelope_id: string;
  role_name: string;
  kba_required: false;
}

/**
 * KBA has been completed and no further action is required.
 */
export interface IRecipientKbaStatusComplete {
  envelope_id: string;
  role_name: string;
  kba_required: true;
  kba_completed: true;
  kba_method: string;
}

/**
 * A PIN code is required. Prompt the user to enter this PIN, and submit it via `submitKbaPin()`.
 */
export interface IRecipientKbaStatusPinRequired {
  envelope_id: string;
  role_name: string;
  kba_required: true;
  kba_completed: false;
  kba_method: 'pin';
}

/**
 * A full identity verification is required. Prompt the user for their address and other (optional)
 * details and submit them via `submitKbaIdentity()`.
 */
export interface IRecipientKbaStatusIdentityRequired {
  envelope_id: string;
  role_name: string;
  kba_required: true;
  kba_completed: false;
  kba_method: 'identity';
}

/**
 * Triggered by full identity verification if additional challenges are required. The recipient
 * should be shown the message and options, and submit a response via `submitKbaChallengeResponse()`.
 * Note that this response may be issued more than once if multiple challenges are required.
 */
export interface IRecipientKbaChallengeRequired {
  envelope_id: string;
  role_name: string;
  kba_required: true;
  kba_completed: false;
  kba_method: 'challenge';
  challenges: {
    type: string;
    message: string;
    options: string[];
  }[];
}

/**
 * Identity verification has failed. The user should be shown the message included. No further
 * signing operations may be performed.
 */
export interface IRecipientKbaStatusFailed {
  envelope_id: string;
  role_name: string;
  kba_required: true;
  kba_completed: false;
  kba_method: 'failed';
  message: string;
}

export type TRecipientKbaStatus =
  | IRecipientKbaStatusNotRequired
  | IRecipientKbaStatusComplete
  | IRecipientKbaStatusPinRequired
  | IRecipientKbaStatusIdentityRequired
  | IRecipientKbaChallengeRequired
  | IRecipientKbaStatusFailed;

/**
 * Get the current KBA status. Note that this may only be called by the recipient and requires a
 * valid signing session to proceed. Although the Recipient object itself contains indications of
 * whether KBA is required, it will not contain the current status of the process. If
 * `recipient.kba_method` is set (not null), and `recipient.kba_completed` is false, this endpoint
 * should be called to determine the next KBA step required.
 */
export const getKbaStatus = (endpoint: VerdocsEndpoint, envelopeId: string, roleName: string) =>
  endpoint.api //
    .get<TRecipientKbaStatus>(`/v2/kba/${envelopeId}/${encodeURIComponent(roleName)}`)
    .then((r) => r.data);

/**
 * Submit a response to a KBA PIN challenge.
 */
export const submitKbaPin = (endpoint: VerdocsEndpoint, envelopeId: string, roleName: string, pin: string) =>
  endpoint.api //
    .post<TRecipientKbaStatus>(`/v2/kba/pin`, {envelopeId, roleName, pin})
    .then((r) => r.data);

export interface IKbaIdentity {
  address1: string;
  address2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  ssn?: string;
  ssnLast4?: string;
}

/**
 * Submit an identity response to a KBA challenge.
 */
export const submitKbaIdentity = (endpoint: VerdocsEndpoint, envelopeId: string, roleName: string, identity: IKbaIdentity) =>
  endpoint.api //
    .post<TRecipientKbaStatus>(`/v2/kba/identity`, {envelopeId, roleName, identity})
    .then((r) => r.data);

/**
 * Submit an identity response to a KBA challenge.
 */
export const submitKbaChallengeResponse = (endpoint: VerdocsEndpoint, envelopeId: string, roleName: string, response: string) =>
  endpoint.api //
    .post<TRecipientKbaStatus>(`/v2/kba/response`, {envelopeId, roleName, response})
    .then((r) => r.data);
