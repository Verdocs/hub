namespace Verdocs.Models;

/// <summary>
/// Known usage counters reported by the organization usage endpoint. Properties stay typed as
/// string so an unknown future value never breaks deserialization.
/// </summary>
public static class UsageType
{
    /// <summary>Envelopes created.</summary>
    public const string Envelope = "envelope";

    /// <summary>Envelopes canceled.</summary>
    public const string EnvelopeCanceled = "envelope_canceled";

    /// <summary>Envelopes completed.</summary>
    public const string EnvelopeCompleted = "envelope_completed";

    /// <summary>Envelopes expired.</summary>
    public const string EnvelopeExpired = "envelope_expired";

    /// <summary>SMS invitations sent.</summary>
    public const string SmsInvite = "sms_invite";

    /// <summary>Templates created.</summary>
    public const string Template = "template";

    /// <summary>Email one-time-code authentications performed.</summary>
    public const string AuthEmail = "auth_email";

    /// <summary>SMS one-time-code authentications performed.</summary>
    public const string AuthSms = "auth_sms";

    /// <summary>Knowledge-based authentications performed.</summary>
    public const string AuthKba = "auth_kba";

    /// <summary>ID verifications performed.</summary>
    public const string AuthId = "auth_id";

    /// <summary>Passcode authentications performed.</summary>
    public const string AuthPasscode = "auth_passcode";
}
