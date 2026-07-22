namespace Verdocs.Models;

/// <summary>
/// Common values for <see cref="EnvelopeHistory.EventDetail"/>. This set is open: modification
/// events carry a free-form description, so always treat the field as an arbitrary string.
/// </summary>
public static class EventDetail
{
    /// <summary>The action happened inside the app.</summary>
    public const string InApp = "in_app";

    /// <summary>The action came from an email link.</summary>
    public const string Mail = "mail";

    /// <summary>The action was performed by a signer.</summary>
    public const string Signer = "signer";

    /// <summary>The action came from an SMS link.</summary>
    public const string Sms = "sms";

    /// <summary>The action was triggered by a reminder.</summary>
    public const string Reminder = "reminder";

    /// <summary>The action was performed by a preparer.</summary>
    public const string Preparer = "preparer";

    /// <summary>The action was performed manually.</summary>
    public const string Manual = "manual";

    /// <summary>The action came from an in-person signing link.</summary>
    public const string InPersonLink = "in_person_link";

    /// <summary>The action was performed by a guest.</summary>
    public const string Guest = "guest";

    /// <summary>The action came from an email one-time code flow.</summary>
    public const string Email = "email";

    /// <summary>No detail was recorded; the wire sends an empty string.</summary>
    public const string None = "";
}
