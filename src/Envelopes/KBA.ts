import {VerdocsEndpoint} from '../VerdocsEndpoint';

/**
 * KBA is not required at this time.
 */
export interface IRecipientKbaStepNone {
  envelope_id: string;
  role_name: string;
  kba_step: 'none';
}

/**
 * KBA has been completed and no further action is required.
 */
export interface IRecipientKbaStepComplete {
  envelope_id: string;
  role_name: string;
  kba_step: 'complete';
}

/**
 * A PIN code is required. Prompt the user to enter this PIN, and submit it via `submitKbaPin()`.
 */
export interface IRecipientKbaStepPin {
  envelope_id: string;
  role_name: string;
  kba_step: 'pin';
}

/**
 * A full identity verification is required. Prompt the user for their address and other (optional)
 * details and submit them via `submitKbaIdentity()`.
 */
export interface IRecipientKbaStepIdentity {
  envelope_id: string;
  role_name: string;
  kba_step: 'identity';
}

/**
 * If a positive identification was not possible, the user may be asked to answer 1 or more
 * challenge questions via this response. They should be submitted via `submitKbaChallengeResponse()`.
 */
export interface IRecipientKbaStepChallenge {
  envelope_id: string;
  role_name: string;
  kba_step: 'challenge';
  questions: {
    type: string;
    message: string;
    options: (string | number)[];
  }[];
}

/**
 * Identity verification has failed. The user should be shown the message included. No further
 * signing operations may be performed.
 */
export interface IRecipientKbaStepFailed {
  envelope_id: string;
  role_name: string;
  kba_step: 'failed';
  message: string;
}

export type TRecipientKbaStep =
  | IRecipientKbaStepNone
  | IRecipientKbaStepComplete
  | IRecipientKbaStepPin
  | IRecipientKbaStepIdentity
  | IRecipientKbaStepChallenge
  | IRecipientKbaStepFailed;

/**
 * Get the current KBA status. Note that this may only be called by the recipient and requires a
 * valid signing session to proceed. Although the Recipient object itself contains indications of
 * whether KBA is required, it will not contain the current status of the process. If
 * `recipient.kba_method` is set (not null), and `recipient.kba_completed` is false, this endpoint
 * should be called to determine the next KBA step required.
 */
export const getKbaStep = (endpoint: VerdocsEndpoint, envelopeId: string, roleName: string) =>
  endpoint.api //
    .get<TRecipientKbaStep>(`/v2/kba/${envelopeId}/${encodeURIComponent(roleName)}`)
    .then((r) => r.data);

/**
 * Submit a response to a KBA PIN challenge.
 */
export const submitKbaPin = (endpoint: VerdocsEndpoint, envelopeId: string, roleName: string, pin: string) =>
  endpoint.api //
    .post<TRecipientKbaStep>(`/v2/kba/pin`, {envelopeId, roleName, pin})
    .then((r) => r.data);

export interface IKbaIdentity {
  firstName: string;
  lastName: string;
  address: string;
  city?: string;
  state?: string;
  zip?: string;
  ssnLast4?: string;
}

/**
 * Submit an identity response to a KBA challenge.
 */
export const submitKbaIdentity = (endpoint: VerdocsEndpoint, envelopeId: string, roleName: string, identity: IKbaIdentity) =>
  endpoint.api //
    .post<TRecipientKbaStep>(`/v2/kba/identity`, {envelopeId, roleName, identity})
    .then((r) => r.data);

export interface IKbaChallengeResponse {
  responses: {
    type: string;
    answer: string | number;
  }[];
}

/**
 * Submit an identity response to a KBA challenge. Answers should be submitted in the same order as
 * the challenges were listed in `IRecipientKbaStepChallenge.questions`.
 */
export const submitKbaChallengeResponse = (
  endpoint: VerdocsEndpoint,
  envelopeId: string,
  roleName: string,
  response: IKbaChallengeResponse,
) =>
  endpoint.api //
    .post<TRecipientKbaStep>(`/v2/kba/response`, {envelopeId, roleName, response})
    .then((r) => r.data);
