namespace Verdocs.Models;

/// <summary>
/// Known values for <see cref="Entitlement.Feature"/> (the js-sdk TEntitlement union; renamed
/// here to avoid clashing with the <see cref="Entitlement"/> record). Properties stay typed as
/// string so an unknown future value never breaks deserialization. There is no id_auth
/// constant: the API renamed that entitlement to id_verification and added
/// id_verification_plus, and no longer returns id_auth.
/// </summary>
public static class EntitlementFeature
{
    /// <summary>Envelope creation.</summary>
    public const string Envelope = "envelope";

    /// <summary>Knowledge-based recipient authentication.</summary>
    public const string KbaAuth = "kba_auth";

    /// <summary>Passcode recipient authentication.</summary>
    public const string PasscodeAuth = "passcode_auth";

    /// <summary>SMS one-time-code recipient authentication.</summary>
    public const string SmsAuth = "sms_auth";

    /// <summary>Combined knowledge-based and ID recipient authentication.</summary>
    public const string KbaIdAuth = "kba_id_auth";

    /// <summary>ID verification: the signer photographs a government ID and takes a selfie.</summary>
    public const string IdVerification = "id_verification";

    /// <summary>ID Verification Plus, the higher tier of ID verification.</summary>
    public const string IdVerificationPlus = "id_verification_plus";

    /// <summary>Custom signing disclaimer text.</summary>
    public const string CustomDisclaimer = "custom_disclaimer";
}
