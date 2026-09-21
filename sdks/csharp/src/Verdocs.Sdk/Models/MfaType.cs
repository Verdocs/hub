namespace Verdocs.Models;

/// <summary>
/// Known values for <see cref="MfaStatus.Type"/>. Only time-based one-time passwords are
/// supported today. The property stays typed as string so a new factor type never breaks
/// deserialization.
/// </summary>
public static class MfaType
{
    /// <summary>A time-based one-time password from an authenticator app.</summary>
    public const string Totp = "totp";
}
