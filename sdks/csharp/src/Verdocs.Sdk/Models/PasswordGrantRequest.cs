using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>OAuth2 password grant body for POST /v2/oauth2/token.</summary>
public sealed record PasswordGrantRequest : AuthenticateRequest
{
    /// <summary>The username (email address) to authenticate with.</summary>
    public required string Username { get; init; }

    /// <summary>The password to authenticate with.</summary>
    public required string Password { get; init; }

    /// <summary>Optional client ID for the request.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? ClientId { get; init; }

    /// <summary>Optional scope to limit the token to. Only set when instructed by Verdocs support.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Scope { get; init; }
}
