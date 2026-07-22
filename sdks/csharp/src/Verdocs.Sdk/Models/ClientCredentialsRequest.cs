using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>OAuth2 client_credentials grant body for POST /v2/oauth2/token.</summary>
public sealed record ClientCredentialsRequest : AuthenticateRequest
{
    /// <summary>The OAuth2 client ID.</summary>
    public required string ClientId { get; init; }

    /// <summary>The OAuth2 client secret. Never expose this in front-end code.</summary>
    public required string ClientSecret { get; init; }

    /// <summary>Optional scope to limit the token to. Only set when instructed by Verdocs support.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Scope { get; init; }
}
