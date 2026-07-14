using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// The result of creating an organization. For a top-level organization the server switches
/// the caller to a new owner profile and issues fresh session tokens, so the token fields are
/// set and should be applied with <see cref="VerdocsEndpoint.SetToken"/>. For a child
/// organization (a request with a parent ID) the caller's session is left alone: the token and
/// profile fields are null and <see cref="Organization"/> carries the new child, including its
/// automatically created default API key in <see cref="Models.Organization.ApiKey"/>.
/// </summary>
public sealed record CreateOrganizationResponse
{
    /// <summary>The access token for the caller's new session. Null for child organizations.</summary>
    public string? AccessToken { get; init; }

    /// <summary>An OpenID Connect ID token describing the caller. Null for child organizations.</summary>
    public string? IdToken { get; init; }

    /// <summary>Token that can be exchanged for a fresh session. Null for child organizations.</summary>
    public string? RefreshToken { get; init; }

    /// <summary>Lifetime of the access token, in seconds. Null for child organizations.</summary>
    public long? ExpiresIn { get; init; }

    /// <summary>Access token expiration as a Unix epoch timestamp, in seconds. Null for child organizations.</summary>
    public long? AccessTokenExp { get; init; }

    /// <summary>Refresh token expiration as a Unix epoch timestamp, in seconds. Null for child organizations.</summary>
    public long? RefreshTokenExp { get; init; }

    /// <summary>The new organization.</summary>
    public Organization? Organization { get; init; }

    /// <summary>The caller's new owner profile. Null for child organizations.</summary>
    public Profile? Profile { get; init; }

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
