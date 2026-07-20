using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>OAuth2 refresh_token grant body for POST /v2/oauth2/token.</summary>
public sealed record RefreshTokenGrantRequest : AuthenticateRequest
{
    /// <summary>The refresh token from a prior authenticate call.</summary>
    public required string RefreshToken { get; init; }

    /// <summary>Optional client ID for the request.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? ClientId { get; init; }

    /// <summary>Optional scope to limit the token to. Only set when instructed by Verdocs support.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Scope { get; init; }
}
