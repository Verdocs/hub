using Verdocs.Models;

namespace Verdocs.Helpers;

/// <summary>
/// Pure helpers that identify the operations available on an envelope to a profile or
/// session, ported from the js-sdk's Envelopes/Permissions.ts. All checks run locally on data
/// already fetched; nothing here calls the API, and the server remains the authority on what
/// a caller may actually do.
/// </summary>
public static class EnvelopePermissions
{
    // The permanent envelope end states; see EnvelopeStatus.
    private static readonly string[] EnvelopeEndStatuses =
        [EnvelopeStatus.Complete, EnvelopeStatus.Declined, EnvelopeStatus.Canceled];

    // Recipient states with no action left to take; see RecipientStatus.
    private static readonly string[] SettledRecipientStatuses =
        [RecipientStatus.Submitted, RecipientStatus.Canceled, RecipientStatus.Declined];

    /// <summary>
    /// True when the profile ID owns the envelope. Ports the js-sdk's isEnvelopeOwner.
    ///
    /// <example>
    /// <code>
    /// if (EnvelopePermissions.IsEnvelopeOwner(profile.Id, envelope))
    /// {
    ///     // ...
    /// }
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="profileId">The profile ID to check, or null for no session.</param>
    /// <param name="envelope">The envelope to check against.</param>
    /// <returns>True when the profile ID matches the envelope's creator.</returns>
    /// <sdkOperation>envelope.isEnvelopeOwner</sdkOperation>
    /// <sdkGroup>Envelope</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
    public static bool IsEnvelopeOwner(string? profileId, Envelope envelope) =>
        envelope.ProfileId == profileId;

    /// <summary>
    /// True when the profile ID is a recipient within the envelope. Ports the js-sdk's
    /// isEnvelopeRecipient.
    ///
    /// <example>
    /// <code>
    /// if (EnvelopePermissions.IsEnvelopeRecipient(profile.Id, envelope))
    /// {
    ///     // ...
    /// }
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="profileId">The profile ID to check, or null for no session.</param>
    /// <param name="envelope">The envelope to check against.</param>
    /// <returns>True when a recipient carries the profile ID.</returns>
    /// <sdkOperation>envelope.isEnvelopeRecipient</sdkOperation>
    /// <sdkGroup>Envelope</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
    public static bool IsEnvelopeRecipient(string? profileId, Envelope envelope) =>
        (envelope.Recipients ?? []).Any(recipient => recipient.ProfileId == profileId);

    /// <summary>
    /// True when the profile ID is the envelope's sender or one of its recipients. Ports the
    /// js-sdk's canAccessEnvelope.
    ///
    /// <example>
    /// <code>
    /// if (EnvelopePermissions.CanAccessEnvelope(profile.Id, envelope))
    /// {
    ///     // ...
    /// }
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="profileId">The profile ID to check, or null for no session.</param>
    /// <param name="envelope">The envelope to check against.</param>
    /// <returns>True when the profile ID may access the envelope.</returns>
    /// <sdkOperation>envelope.canAccessEnvelope</sdkOperation>
    /// <sdkGroup>Envelope</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
    public static bool CanAccessEnvelope(string? profileId, Envelope envelope) =>
        IsEnvelopeOwner(profileId, envelope) || IsEnvelopeRecipient(profileId, envelope);

    /// <summary>
    /// True when the user's profile owns the envelope. Ports the js-sdk's userIsEnvelopeOwner.
    ///
    /// <example>
    /// <code>
    /// if (EnvelopePermissions.UserIsEnvelopeOwner(profile, envelope))
    /// {
    ///     // ...
    /// }
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="profile">The profile to check, or null for no session.</param>
    /// <param name="envelope">The envelope to check against.</param>
    /// <returns>True when the profile matches the envelope's creator.</returns>
    /// <sdkOperation>envelope.userIsEnvelopeOwner</sdkOperation>
    /// <sdkGroup>Envelope</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
    public static bool UserIsEnvelopeOwner(Profile? profile, Envelope envelope) =>
        envelope.ProfileId == profile?.Id;

    /// <summary>
    /// True when the user's profile is a recipient within the envelope. Ports the js-sdk's
    /// userIsEnvelopeRecipient. Matches by profile ID only; recipients matched by email alone
    /// do not count.
    ///
    /// <example>
    /// <code>
    /// if (EnvelopePermissions.UserIsEnvelopeRecipient(profile, envelope))
    /// {
    ///     // ...
    /// }
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="profile">The profile to check, or null for no session.</param>
    /// <param name="envelope">The envelope to check against.</param>
    /// <returns>True when a recipient carries the profile's ID.</returns>
    /// <sdkOperation>envelope.userIsEnvelopeRecipient</sdkOperation>
    /// <sdkGroup>Envelope</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
    public static bool UserIsEnvelopeRecipient(Profile? profile, Envelope envelope) =>
        (envelope.Recipients ?? []).Any(recipient => recipient.ProfileId == profile?.Id);

    /// <summary>
    /// True when the envelope still has pending actions (not complete, declined, or
    /// canceled). Ports the js-sdk's envelopeIsActive.
    ///
    /// <example>
    /// <code>
    /// if (EnvelopePermissions.EnvelopeIsActive(envelope))
    /// {
    ///     // ...
    /// }
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="envelope">The envelope to check.</param>
    /// <returns>True when the envelope is still active.</returns>
    /// <sdkOperation>envelope.envelopeIsActive</sdkOperation>
    /// <sdkGroup>Envelope</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
    public static bool EnvelopeIsActive(Envelope envelope) =>
        envelope.Status != EnvelopeStatus.Complete &&
        envelope.Status != EnvelopeStatus.Declined &&
        envelope.Status != EnvelopeStatus.Canceled;

    /// <summary>
    /// True when the envelope's status is anything other than "complete". Ports the js-sdk's
    /// envelopeIsComplete, which despite its name returns true for envelopes that are NOT
    /// complete; the inverted comparison is kept as-is for parity.
    ///
    /// <example>
    /// <code>
    /// if (EnvelopePermissions.EnvelopeIsComplete(envelope))
    /// {
    ///     // ...
    /// }
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="envelope">The envelope to check.</param>
    /// <returns>True when the envelope is not complete.</returns>
    /// <sdkOperation>envelope.envelopeIsComplete</sdkOperation>
    /// <sdkGroup>Envelope</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
    public static bool EnvelopeIsComplete(Envelope envelope) =>
        envelope.Status != EnvelopeStatus.Complete;

    /// <summary>
    /// True when the user owns the envelope and it is still active enough to cancel. Ports
    /// the js-sdk's userCanCancelEnvelope.
    ///
    /// <example>
    /// <code>
    /// if (EnvelopePermissions.UserCanCancelEnvelope(profile, envelope))
    /// {
    ///     // ...
    /// }
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="profile">The profile to check, or null for no session.</param>
    /// <param name="envelope">The envelope to check against.</param>
    /// <returns>True when the user may cancel the envelope.</returns>
    /// <sdkOperation>envelope.userCanCancelEnvelope</sdkOperation>
    /// <sdkGroup>Envelope</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
    public static bool UserCanCancelEnvelope(Profile? profile, Envelope envelope) =>
        UserIsEnvelopeOwner(profile, envelope) &&
        envelope.Status != EnvelopeStatus.Complete &&
        envelope.Status != EnvelopeStatus.Declined &&
        envelope.Status != EnvelopeStatus.Canceled;

    /// <summary>
    /// True when the user owns the envelope and it is still active enough to finish early.
    /// Ports the js-sdk's userCanFinishEnvelope.
    ///
    /// <example>
    /// <code>
    /// if (EnvelopePermissions.UserCanFinishEnvelope(profile, envelope))
    /// {
    ///     // ...
    /// }
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="profile">The profile to check, or null for no session.</param>
    /// <param name="envelope">The envelope to check against.</param>
    /// <returns>True when the user may finish the envelope.</returns>
    /// <sdkOperation>envelope.userCanFinishEnvelope</sdkOperation>
    /// <sdkGroup>Envelope</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
    public static bool UserCanFinishEnvelope(Profile? profile, Envelope envelope) =>
        UserIsEnvelopeOwner(profile, envelope) &&
        envelope.Status != EnvelopeStatus.Complete &&
        envelope.Status != EnvelopeStatus.Declined &&
        envelope.Status != EnvelopeStatus.Canceled;

    /// <summary>
    /// True when the recipient has a pending action. Ports the js-sdk's recipientHasAction.
    /// Note this does not necessarily mean the recipient can act yet; see
    /// <see cref="RecipientCanAct"/>.
    ///
    /// <example>
    /// <code>
    /// if (EnvelopePermissions.RecipientHasAction(recipient))
    /// {
    ///     // ...
    /// }
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="recipient">The recipient to check.</param>
    /// <returns>True when the recipient has not yet submitted, declined, or been canceled.</returns>
    /// <sdkOperation>envelope.recipientHasAction</sdkOperation>
    /// <sdkGroup>Envelope</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
    public static bool RecipientHasAction(Recipient recipient) =>
        !SettledRecipientStatuses.Contains(recipient.Status);

    /// <summary>
    /// The recipients who still have a pending action, in the envelope's stored order. Ports
    /// the js-sdk's getRecipientsWithActions. Not all of these recipients may be able to act
    /// yet, and a complete, declined, or canceled envelope returns an empty list.
    ///
    /// <example>
    /// <code>
    /// var pending = EnvelopePermissions.GetRecipientsWithActions(envelope);
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="envelope">The envelope to scan.</param>
    /// <returns>The recipients with actions remaining.</returns>
    /// <sdkOperation>envelope.getRecipientsWithActions</sdkOperation>
    /// <sdkGroup>Envelope</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
    public static IReadOnlyList<Recipient> GetRecipientsWithActions(Envelope envelope) =>
        EnvelopeEndStatuses.Contains(envelope.Status)
            ? []
            : (envelope.Recipients ?? []).Where(RecipientHasAction).ToList();

    /// <summary>
    /// True when the recipient is next up to act. Ports the js-sdk's recipientCanAct: the
    /// recipient acts when it shares a sequence number with the first entry in the
    /// pending-actions list.
    ///
    /// <example>
    /// <code>
    /// var pending = EnvelopePermissions.GetRecipientsWithActions(envelope);
    /// if (EnvelopePermissions.RecipientCanAct(recipient, pending))
    /// {
    ///     // ...
    /// }
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="recipient">The recipient to check.</param>
    /// <param name="recipientsWithActions">The pending recipients, from <see cref="GetRecipientsWithActions"/>.</param>
    /// <returns>True when the recipient can act now.</returns>
    /// <sdkOperation>envelope.recipientCanAct</sdkOperation>
    /// <sdkGroup>Envelope</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
    public static bool RecipientCanAct(Recipient recipient, IReadOnlyList<Recipient> recipientsWithActions) =>
        recipientsWithActions.Count > 0 && recipient.Sequence == recipientsWithActions[0].Sequence;

    /// <summary>
    /// The envelope recipient matching the session's email, regardless of whether the session
    /// is a user or signing session. Ports the js-sdk's getMyRecipient. The email comparison
    /// is exact (case-sensitive), matching the js-sdk.
    ///
    /// <example>
    /// <code>
    /// var myRecipient = EnvelopePermissions.GetMyRecipient(session, envelope);
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="session">The current session, or null for no session.</param>
    /// <param name="envelope">The envelope to scan.</param>
    /// <returns>The matching recipient, or null when there is none.</returns>
    /// <sdkOperation>envelope.getMyRecipient</sdkOperation>
    /// <sdkGroup>Envelope</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
    public static Recipient? GetMyRecipient(VerdocsSession? session, Envelope envelope) =>
        (envelope.Recipients ?? []).FirstOrDefault(recipient => recipient.Email == session?.Email);

    /// <summary>
    /// True when the recipient matching the email (case-insensitive) is next up to act. Ports
    /// the js-sdk's userCanAct.
    ///
    /// <example>
    /// <code>
    /// var pending = EnvelopePermissions.GetRecipientsWithActions(envelope);
    /// if (EnvelopePermissions.UserCanAct(email, pending))
    /// {
    ///     // ...
    /// }
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="email">The email address to look for.</param>
    /// <param name="recipientsWithActions">The pending recipients, from <see cref="GetRecipientsWithActions"/>.</param>
    /// <returns>True when the matching recipient can act now.</returns>
    /// <sdkOperation>envelope.userCanAct</sdkOperation>
    /// <sdkGroup>Envelope</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
    public static bool UserCanAct(string email, IReadOnlyList<Recipient> recipientsWithActions)
    {
        var recipient = recipientsWithActions.FirstOrDefault(
            r => string.Equals(r.Email, email, StringComparison.OrdinalIgnoreCase));
        return recipient != null && recipient.Sequence == recipientsWithActions[0].Sequence;
    }

    /// <summary>
    /// The envelope recipient matching the email (case-insensitive). Ports the js-sdk's
    /// getRecipient.
    ///
    /// <example>
    /// <code>
    /// var recipient = EnvelopePermissions.GetRecipient(email, envelope);
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="email">The email address to look for.</param>
    /// <param name="envelope">The envelope to scan.</param>
    /// <returns>The matching recipient, or null when there is none.</returns>
    /// <sdkOperation>envelope.getRecipient</sdkOperation>
    /// <sdkGroup>Envelope</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
    public static Recipient? GetRecipient(string email, Envelope envelope) =>
        (envelope.Recipients ?? []).FirstOrDefault(
            r => string.Equals(r.Email, email, StringComparison.OrdinalIgnoreCase));

    /// <summary>
    /// True when the recipient matching the email (case-insensitive) is next up to act.
    /// Ports the js-sdk's getRecipientWithActions, which despite its name returns a flag
    /// rather than the recipient; the behavior is kept as-is for parity.
    ///
    /// <example>
    /// <code>
    /// if (EnvelopePermissions.GetRecipientWithActions(email, envelope))
    /// {
    ///     // ...
    /// }
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="email">The email address to look for.</param>
    /// <param name="envelope">The envelope to scan.</param>
    /// <returns>True when the matching recipient can act now.</returns>
    /// <sdkOperation>envelope.getRecipientWithActions</sdkOperation>
    /// <sdkGroup>Envelope</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
    public static bool GetRecipientWithActions(string email, Envelope envelope)
    {
        var recipientsWithActions = GetRecipientsWithActions(envelope);
        var recipient = recipientsWithActions.FirstOrDefault(
            r => string.Equals(r.Email, email, StringComparison.OrdinalIgnoreCase));
        return recipient != null && recipient.Sequence == recipientsWithActions[0].Sequence;
    }

    /// <summary>
    /// True when the user can sign now: the envelope is active, the user is one of its
    /// recipients, and it is that recipient's turn. Ports the js-sdk's userCanSignNow. The
    /// turn lookup matches by profile ID or email, but the recipient membership check matches
    /// by profile ID only, so a recipient tied to the user by email alone never passes; the
    /// js-sdk behaves the same way.
    ///
    /// <example>
    /// <code>
    /// if (EnvelopePermissions.UserCanSignNow(profile, envelope))
    /// {
    ///     // ...
    /// }
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="profile">The profile to check, or null for no session.</param>
    /// <param name="envelope">The envelope to check against.</param>
    /// <returns>True when the user can sign now.</returns>
    /// <sdkOperation>envelope.userCanSignNow</sdkOperation>
    /// <sdkGroup>Envelope</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
    public static bool UserCanSignNow(Profile? profile, Envelope envelope)
    {
        if (profile == null)
        {
            return false;
        }

        var recipientsWithActions = GetRecipientsWithActions(envelope);
        var myRecipient = recipientsWithActions.FirstOrDefault(
            r => r.ProfileId == profile.Id || string.Equals(r.Email, profile.Email, StringComparison.OrdinalIgnoreCase));
        return myRecipient != null &&
               EnvelopeIsActive(envelope) &&
               UserIsEnvelopeRecipient(profile, envelope) &&
               RecipientCanAct(myRecipient, recipientsWithActions);
    }

    /// <summary>
    /// The next recipient with a pending action, in the envelope's stored order. Ports the
    /// js-sdk's getNextRecipient.
    ///
    /// <example>
    /// <code>
    /// var next = EnvelopePermissions.GetNextRecipient(envelope);
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="envelope">The envelope to scan.</param>
    /// <returns>The next pending recipient, or null when none remain.</returns>
    /// <sdkOperation>envelope.getNextRecipient</sdkOperation>
    /// <sdkGroup>Envelope</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
    public static Recipient? GetNextRecipient(Envelope envelope)
    {
        var recipientsWithActions = GetRecipientsWithActions(envelope);
        return recipientsWithActions.Count > 0 ? recipientsWithActions[0] : null;
    }
}
