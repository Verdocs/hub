using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// Credentials for <see cref="VerdocsEndpoint.AuthenticateAsync"/>. The seed supports the
/// password grant; other grant types (client_credentials, refresh_token, authorization_code)
/// arrive with type generation.
/// </summary>
public sealed record AuthenticateRequest
{
    /// <summary>The username (email address) to authenticate with.</summary>
    public required string Username { get; init; }

    /// <summary>The password to authenticate with.</summary>
    public required string Password { get; init; }

    /// <summary>The OAuth2 grant type. Always "password" in this seed.</summary>
    public string GrantType { get; init; } = "password";

    /// <summary>Optional client ID for the request.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? ClientId { get; init; }

    /// <summary>Optional scope to limit the token to. Only set when instructed by Verdocs support.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Scope { get; init; }
}
