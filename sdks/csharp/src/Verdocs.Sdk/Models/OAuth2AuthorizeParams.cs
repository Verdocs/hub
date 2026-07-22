using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>Query parameters that build the OAuth2 authorize URL.</summary>
public sealed record OAuth2AuthorizeParams
{
    /// <summary>The client ID of the registered OAuth2 application.</summary>
    public required string ClientId { get; init; }

    /// <summary>The URI to redirect to after authorization.</summary>
    public required string RedirectUri { get; init; }

    /// <summary>Must be "code" for the authorization code flow.</summary>
    public string ResponseType { get; init; } = "code";

    /// <summary>Opaque CSRF value returned unchanged in the redirect.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? State { get; init; }

    /// <summary>Optional scope to request.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Scope { get; init; }
}
