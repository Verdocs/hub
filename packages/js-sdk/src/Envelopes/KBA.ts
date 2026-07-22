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

/**
 * The recipient's current step in the KBA (Knowledge-Based Authentication) flow. Branch on `kba_step`:
 * `pin` prompts for a PIN and calls submitKbaPin(), `identity` collects address details for
 * submitKbaIdentity(), and `challenge` presents questions for submitKbaChallengeResponse().
 *
 * @sdkGroup KBA
 */
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
 * `recipient.auth_methods` is set (not empty), and `recipient.kba_completed` is false, this endpoint
 * should be called to determine the next KBA step required.
 *
 * ```typescript
 * import {getKbaStep} from '@verdocs/js-sdk';
 *
 * const step = await getKbaStep(endpoint, envelopeId, roleName);
 * if (step.kba_step === 'pin') {
 *   // prompt for the PIN, then call submitKbaPin(...)
 * }
 * ```
 *
 * @sdkOperation kba.getKbaStep
 * @sdkGroup KBA
 * @sdkPage Endpoints
 */
export const getKbaStep = (endpoint: VerdocsEndpoint, envelope_id: string, role_name: string) =>
  endpoint.api //
    .get<TRecipientKbaStep>(`/v2/kba/${envelope_id}/${encodeURIComponent(role_name)}`)
    .then((r) => r.data);

/**
 * Submit a response to a KBA PIN challenge.
 *
 * @sdkOperation kba.submitKbaPin
 * @sdkGroup KBA
 * @sdkPage Endpoints
 */
export const submitKbaPin = (endpoint: VerdocsEndpoint, envelope_id: string, role_name: string, pin: string) =>
  endpoint.api //
    .post<TRecipientKbaStep>(`/v2/kba/pin`, {envelope_id, role_name, pin})
    .then((r) => r.data);

export interface IKbaIdentity {
  firstName: string;
  lastName: string;
  address: string;
  city?: string;
  state?: string;
  zip?: string;
  ssnLast4?: string;
  email?: string;
}

/**
 * Submit an identity response to a KBA challenge.
 *
 * @sdkOperation kba.submitKbaIdentity
 * @sdkGroup KBA
 * @sdkPage Endpoints
 */
export const submitKbaIdentity = (endpoint: VerdocsEndpoint, envelope_id: string, role_name: string, identity: IKbaIdentity) =>
  endpoint.api //
    .post<TRecipientKbaStep>(`/v2/kba/identity`, {envelope_id, role_name, identity})
    .then((r) => r.data);

export interface IKbaChallengeResponse {
  type: string;
  answer: string | number;
}

/**
 * Submit an identity response to a KBA challenge. Answers should be submitted in the same order as
 * the challenges were listed in `IRecipientKbaStepChallenge.questions`.
 *
 * @sdkOperation kba.submitKbaChallengeResponse
 * @sdkGroup KBA
 * @sdkPage Endpoints
 */
export const submitKbaChallengeResponse = (
  endpoint: VerdocsEndpoint,
  envelope_id: string,
  role_name: string,
  responses: IKbaChallengeResponse[],
) =>
  endpoint.api //
    .post<TRecipientKbaStep>(`/v2/kba/response`, {envelope_id, role_name, responses})
    .then((r) => r.data);
