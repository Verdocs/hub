using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>Authentication tokens and expiration details returned by the token endpoint.</summary>
public sealed record AuthenticateResponse
{
    /// <summary>The access token to pass to <see cref="VerdocsEndpoint.SetToken"/>.</summary>
    public string AccessToken { get; init; } = null!;

    /// <summary>An OpenID Connect ID token describing the authenticated user.</summary>
    public string IdToken { get; init; } = null!;

    /// <summary>Token that can be exchanged for a fresh session before the access token expires.</summary>
    public string RefreshToken { get; init; } = null!;

    /// <summary>Lifetime of the access token, in seconds.</summary>
    public long ExpiresIn { get; init; }

    /// <summary>Access token expiration as a Unix epoch timestamp, in seconds.</summary>
    public long AccessTokenExp { get; init; }

    /// <summary>Refresh token expiration as a Unix epoch timestamp, in seconds.</summary>
    public long RefreshTokenExp { get; init; }

    /// <summary>Wire fields this seed model does not cover yet, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
