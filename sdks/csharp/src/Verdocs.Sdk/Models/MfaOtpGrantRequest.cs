namespace Verdocs.Models;

/// <summary>
/// Completes a sign-in that was answered with an MFA challenge, using a code from the user's
/// authenticator app. Body for POST /v2/oauth2/token with the
/// urn:verdocs:params:oauth:grant-type:mfa-otp grant.
/// </summary>
public sealed record MfaOtpGrantRequest : AuthenticateRequest
{
    /// <summary>The token carried by the <see cref="MfaRequiredException"/> that issued the challenge.</summary>
    public required string MfaToken { get; init; }

    /// <summary>The current code from the user's authenticator app. Typed as a string, but always six digits.</summary>
    public required string Otp { get; init; }
}
