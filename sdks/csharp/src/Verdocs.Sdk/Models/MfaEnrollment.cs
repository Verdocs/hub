using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// A pending MFA enrollment. The secret is not active until it is confirmed with
/// <see cref="Resources.Mfa.VerifyMfaEnrollmentAsync"/>.
/// </summary>
public sealed record MfaEnrollment
{
    /// <summary>The base32-encoded TOTP secret, for users who cannot scan a QR code.</summary>
    public string Secret { get; init; } = null!;

    /// <summary>The otpauth:// URI to render as a QR code for authenticator apps.</summary>
    public string OtpauthUrl { get; init; } = null!;

    /// <summary>When the pending enrollment expires if it is not confirmed.</summary>
    public DateTimeOffset ExpiresAt { get; init; }

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
