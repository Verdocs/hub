/**
 * Various helpers to identify available operations for an envelope by a user.
 *
 * @module
 */

import {IEnvelope, IRecipient} from '../Models';
import {IEnvelopeSummary} from './Types';
import {TSession} from '../Sessions';

/**
 * Check to see if the user owns the envelope.
 */
export const userIsEnvelopeOwner = (session: TSession, envelope: IEnvelope | IEnvelopeSummary) =>
  envelope.profile_id === session?.profile_id;

/**
 * Check to see if the user owns the envelope.
 */
export const userIsEnvelopeRecipient = (session: TSession, envelope: IEnvelope | IEnvelopeSummary) =>
  envelope.profile_id === session?.profile_id;

/**
 * Check to see if the envelope has pending actions.
 */
export const envelopeIsActive = (envelope: IEnvelope | IEnvelopeSummary) =>
  envelope.status !== 'complete' && envelope.status !== 'declined' && envelope.status !== 'canceled';

/**
 * Check to see if the envelope has been completed.
 */
export const envelopeIsComplete = (envelope: IEnvelope | IEnvelopeSummary) => envelope.status !== 'complete';

/**
 * Check to see if the user owns the envelope.
 */
export const userCanCancelEnvelope = (session: TSession, envelope: IEnvelope | IEnvelopeSummary) =>
  userIsEnvelopeOwner(session, envelope) &&
  envelope.status !== 'complete' &&
  envelope.status !== 'declined' &&
  envelope.status !== 'canceled';

/**
 * Check to see if the user owns the envelope.
 */
export const userCanFinishEnvelope = (session: TSession, envelope: IEnvelope | IEnvelopeSummary) =>
  userIsEnvelopeOwner(session, envelope) &&
  envelope.status !== 'complete' &&
  envelope.status !== 'declined' &&
  envelope.status !== 'canceled';
/**
 * Returns true if the recipient has a pending action. Note that this does not necessarily mean the recipient can act (yet).
 */
export const recipientHasAction = (recipient: IRecipient) => !['submitted', 'canceled', 'declined'].includes(recipient.status);

/**
 * Returns the recipients who still have a pending action. Note that not all of these recipients may be able to act (yet).
 */
export const getRecipientsWithActions = (envelope: IEnvelope | IEnvelopeSummary) => (envelope?.recipients || []).filter(recipientHasAction);

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
 * Returns true if the user can act.
 */
export const userCanSignNow = (session: TSession, envelope: IEnvelope | IEnvelopeSummary) => {
  if (!session) {
    return false;
  }

  const recipientsWithActions = getRecipientsWithActions(envelope);
  const myRecipient = recipientsWithActions.find((r) => r.profile_id === session?.profile_id || r.email === session?.email);
  return (
    myRecipient &&
    envelopeIsActive(envelope) &&
    userIsEnvelopeRecipient(session, envelope) &&
    recipientCanAct(myRecipient, recipientsWithActions)
  );
};

export const getNextRecipient = (envelope: IEnvelope | IEnvelopeSummary) => {
  const recipientsWithActions = getRecipientsWithActions(envelope);
  return recipientsWithActions?.[0];
};
