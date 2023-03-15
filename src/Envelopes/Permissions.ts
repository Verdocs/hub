/**
 * Various helpers to identify available operations for an envelope by a user.
 *
 * @module
 */

import {EnvelopeStates, IEnvelope} from './Types';
import {TSession} from '../Sessions/Types';

/**
 * Check to see if the user owns the envelope.
 */
export const userIsEnvelopeOwner = (session: TSession, envelope: IEnvelope) => envelope.profile_id === session?.profile_id;

/**
 * Check to see if the user owns the envelope.
 */
export const userIsEnvelopeRecipient = (session: TSession, envelope: IEnvelope) => envelope.profile_id === session?.profile_id;

/**
 * Check to see if the user owns the envelope.
 */
export const userCanCancelEnvelope = (session: TSession, envelope: IEnvelope) =>
  userIsEnvelopeOwner(session, envelope) &&
  envelope.status !== EnvelopeStates.COMPLETE &&
  envelope.status !== EnvelopeStates.DECLINED &&
  envelope.status !== EnvelopeStates.CANCELED;

// export type TEnvelopeStatus = 'complete' | 'pending' | 'in progress' | 'declined' | 'canceled';
/**
 * Check to see if the user owns the envelope.
 */
export const userCanFinishEnvelope = (session: TSession, envelope: IEnvelope) =>
  userIsEnvelopeOwner(session, envelope) &&
  envelope.status !== EnvelopeStates.COMPLETE &&
  envelope.status !== EnvelopeStates.DECLINED &&
  envelope.status !== EnvelopeStates.CANCELED;
