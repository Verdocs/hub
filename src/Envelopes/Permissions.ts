/**
 * Various helpers to identify available operations for an envelope by a user.
 *
 * @module
 */

import {IEnvelope, IProfile, IRecipient} from '../Models';

/**
 * Check to see if the profile ID owns the envelope.
 */
export const isEnvelopeOwner = (profile_id: string | null | undefined, envelope: IEnvelope) => envelope.profile_id === profile_id;

/**
 * Check to see if the profile ID is a recipient within the envelope.
 */
export const isEnvelopeRecipient = (profile_id: string | null | undefined, envelope: IEnvelope) =>
  (envelope.recipients || []).some((recipient) => recipient.profile_id === profile_id);

/**
 * Check to see if the profile ID is the envelope's sender or one of the recipients.
 */
export const canAccessEnvelope = (profile_id: string | null | undefined, envelope: IEnvelope) =>
  isEnvelopeOwner(profile_id, envelope) || isEnvelopeRecipient(profile_id, envelope);

/**
 * Check to see if the user owns the envelope.
 */
export const userIsEnvelopeOwner = (profile: IProfile | null | undefined, envelope: IEnvelope) => envelope.profile_id === profile?.id;

/**
 * Check to see if the user is a recipient within the envelope.
 */
export const userIsEnvelopeRecipient = (profile: IProfile | null | undefined, envelope: IEnvelope) =>
  (envelope.recipients || []).some((recipient) => recipient.profile_id === profile?.id);

/**
 * Check to see if the profile ID is the envelope's sender or one of the recipients.
 */
export const useCanAccessEnvelope = (profile: IProfile | null | undefined, envelope: IEnvelope) =>
  userIsEnvelopeOwner(profile, envelope) || userIsEnvelopeRecipient(profile, envelope);

/**
 * Check to see if the envelope has pending actions.
 */
export const envelopeIsActive = (envelope: IEnvelope) =>
  envelope.status !== 'complete' && envelope.status !== 'declined' && envelope.status !== 'canceled';

/**
 * Check to see if the envelope has been completed.
 */
export const envelopeIsComplete = (envelope: IEnvelope) => envelope.status !== 'complete';

/**
 * Check to see if the user owns the envelope.
 */
export const userCanCancelEnvelope = (profile: IProfile | null | undefined, envelope: IEnvelope) =>
  userIsEnvelopeOwner(profile, envelope) &&
  envelope.status !== 'complete' &&
  envelope.status !== 'declined' &&
  envelope.status !== 'canceled';

/**
 * Check to see if the user owns the envelope.
 */
export const userCanFinishEnvelope = (profile: IProfile | null | undefined, envelope: IEnvelope) =>
  userIsEnvelopeOwner(profile, envelope) &&
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
 * Returns true if the user can act.
 */
export const userCanSignNow = (profile: IProfile | null | undefined, envelope: IEnvelope) => {
  if (!profile) {
    return false;
  }

  const recipientsWithActions = getRecipientsWithActions(envelope);
  const myRecipient = recipientsWithActions.find((r) => r.profile_id === profile?.id || r.email === profile?.email);
  return (
    myRecipient &&
    envelopeIsActive(envelope) &&
    userIsEnvelopeRecipient(profile, envelope) &&
    recipientCanAct(myRecipient, recipientsWithActions)
  );
};

export const getNextRecipient = (envelope: IEnvelope) => {
  const recipientsWithActions = getRecipientsWithActions(envelope);
  return recipientsWithActions?.[0];
};
