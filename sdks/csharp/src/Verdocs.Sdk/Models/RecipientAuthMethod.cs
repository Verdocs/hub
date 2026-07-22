namespace Verdocs.Models;

/// <summary>
/// Known values for <see cref="Recipient.AuthMethods"/> and <see cref="Recipient.AuthStep"/>.
/// "passcode" expects a PIN known to sender and recipient ahead of time, "sms" and "email"
/// send a one-time code over that channel, "kba" asks knowledge questions (prior addresses and
/// the like), and "id" performs full ID-based verification. Properties stay typed as string so
/// an unknown future value never breaks deserialization.
/// </summary>
public static class RecipientAuthMethod
{
    /// <summary>Knowledge-based authentication questions.</summary>
    public const string Kba = "kba";

    /// <summary>A pre-shared PIN or passcode.</summary>
    public const string Passcode = "passcode";

    /// <summary>A one-time code sent by SMS.</summary>
    public const string Sms = "sms";

    /// <summary>A one-time code sent by email.</summary>
    public const string Email = "email";

    /// <summary>Full ID-based identity verification.</summary>
    public const string Id = "id";
}
