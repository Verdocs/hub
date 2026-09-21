namespace Verdocs.Models;

/// <summary>
/// Second half of a PKCE sign-in through a social identity provider: exchanges the login code
/// the provider flow returned for session tokens. Body for POST /v2/oauth2/token with the
/// urn:verdocs:params:oauth:grant-type:login-code grant.
/// </summary>
public sealed record LoginCodeGrantRequest : AuthenticateRequest
{
    /// <summary>The login_code query parameter the user came back with after the provider sign-in.</summary>
    public required string LoginCode { get; init; }

    /// <summary>The PKCE verifier whose challenge was passed to <see cref="Resources.Auth.GetSocialLoginUrl"/>.</summary>
    public required string CodeVerifier { get; init; }
}
