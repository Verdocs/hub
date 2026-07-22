using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// Result of <see cref="Resources.Profiles.DeleteAsync"/>. The API answers with one of two
/// shapes: when the caller's current profile was deleted and another remains, the token
/// fields carry a fresh session for the next profile (pass <see cref="AccessToken"/> to
/// <see cref="VerdocsEndpoint.SetToken"/> to keep working); when the last profile was
/// deleted, only <see cref="Status"/> and <see cref="Message"/> are set and the caller is
/// logged out.
/// </summary>
public sealed record DeleteProfileResponse
{
    /// <summary>Access token for the next available profile, or null if none remains.</summary>
    public string? AccessToken { get; init; }

    /// <summary>OpenID Connect ID token for the next available profile, or null if none remains.</summary>
    public string? IdToken { get; init; }

    /// <summary>Refresh token for the new session, or null if none remains.</summary>
    public string? RefreshToken { get; init; }

    /// <summary>Lifetime of the access token, in seconds.</summary>
    public long? ExpiresIn { get; init; }

    /// <summary>Access token expiration as a Unix epoch timestamp, in seconds.</summary>
    public long? AccessTokenExp { get; init; }

    /// <summary>Refresh token expiration as a Unix epoch timestamp, in seconds.</summary>
    public long? RefreshTokenExp { get; init; }

    /// <summary>"OK" when the last profile was deleted; null when tokens were issued instead.</summary>
    public string? Status { get; init; }

    /// <summary>Logout notice sent when the last profile was deleted.</summary>
    public string? Message { get; init; }

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
