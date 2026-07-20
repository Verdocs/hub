namespace Verdocs.Models;

/// <summary>OAuth2 authorization_code grant body for POST /v2/oauth2/token.</summary>
public sealed record AuthorizationCodeRequest : AuthenticateRequest
{
    /// <summary>The authorization code received from the authorize redirect.</summary>
    public required string Code { get; init; }

    /// <summary>The OAuth2 client ID.</summary>
    public required string ClientId { get; init; }

    /// <summary>The OAuth2 client secret.</summary>
    public required string ClientSecret { get; init; }

    /// <summary>Must match the redirect_uri used in the authorize request.</summary>
    public required string RedirectUri { get; init; }
}
