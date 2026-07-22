namespace Verdocs.Models;

/// <summary>
/// Known values for <see cref="EnvelopeHistory.Event"/>. Properties stay typed as string so an
/// unknown future value never breaks deserialization.
/// </summary>
public static class HistoryEvent
{
    /// <summary>A recipient signed their fields.</summary>
    public const string RecipientSigned = "recipient:signed";

    /// <summary>A recipient opened the envelope.</summary>
    public const string RecipientOpened = "recipient:opened";

    /// <summary>A recipient submitted their work.</summary>
    public const string RecipientSubmitted = "recipient:submitted";

    /// <summary>A preparer finished preparing fields.</summary>
    public const string RecipientPrepared = "recipient:prepared";

    /// <summary>A recipient claimed the envelope.</summary>
    public const string RecipientClaimed = "recipient:claimed";

    /// <summary>A recipient agreed to electronic signing disclosures.</summary>
    public const string RecipientAgreed = "recipient:agreed";

    /// <summary>A recipient was invited.</summary>
    public const string RecipientInvited = "recipient:invited";

    /// <summary>A reminder was sent to a recipient.</summary>
    public const string RecipientReminder = "recipient:reminder";

    /// <summary>A recipient delegated signing to someone else.</summary>
    public const string RecipientDelegated = "recipient:delegated";

    /// <summary>A recipient updated their own details.</summary>
    public const string RecipientUpdatedInfo = "recipient:updated_info";

    /// <summary>A recipient declined to sign.</summary>
    public const string RecipientDeclined = "recipient:declined";

    /// <summary>A recipient passed knowledge-based authentication.</summary>
    public const string RecipientKbaVerified = "recipient:kba_verified";

    /// <summary>A recipient failed knowledge-based authentication.</summary>
    public const string RecipientKbaFailed = "recipient:kba_failed";

    /// <summary>A recipient passed ID verification.</summary>
    public const string RecipientIdVerified = "recipient:id_verified";

    /// <summary>A recipient failed ID verification.</summary>
    public const string RecipientIdFailed = "recipient:id_failed";

    /// <summary>A recipient entered the correct passcode.</summary>
    public const string RecipientPinVerified = "recipient:pin_verified";

    /// <summary>A recipient entered an incorrect passcode.</summary>
    public const string RecipientPinFailed = "recipient:pin_failed";

    /// <summary>An invitation was re-sent.</summary>
    public const string InvitationResent = "invitation:resent";

    /// <summary>A copy of the completed envelope was sent to a CC party.</summary>
    public const string EnvelopeCc = "envelope:cc";

    /// <summary>The envelope was canceled.</summary>
    public const string EnvelopeCanceled = "envelope:canceled";

    /// <summary>The envelope expired.</summary>
    public const string EnvelopeExpired = "envelope:expired";

    /// <summary>The envelope owner updated a recipient's details.</summary>
    public const string OwnerUpdatedRecipientInfo = "owner:updated_recipient_info";

    /// <summary>The envelope owner generated an in-person signing link.</summary>
    public const string OwnerGetInPersonLink = "owner:get_in_person_link";

    /// <summary>The envelope was created. Deprecated: read the envelope's created_at instead.</summary>
    public const string EnvelopeCreated = "envelope:created";

    /// <summary>The envelope was completed. Deprecated: read the envelope's status and updated_at instead.</summary>
    public const string EnvelopeCompleted = "envelope:completed";
}
