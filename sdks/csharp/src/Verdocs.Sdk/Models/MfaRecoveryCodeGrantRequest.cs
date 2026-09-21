namespace Verdocs.Models;

/// <summary>
/// Completes a sign-in that was answered with an MFA challenge, using one of the user's backup
/// codes. Body for POST /v2/oauth2/token with the
/// urn:verdocs:params:oauth:grant-type:mfa-recovery-code grant. Backup codes are one-time-use,
/// so a UI that accepts them should encourage the user to generate a fresh set before they
/// run out.
/// </summary>
public sealed record MfaRecoveryCodeGrantRequest : AuthenticateRequest
{
    /// <summary>The token carried by the <see cref="MfaRequiredException"/> that issued the challenge.</summary>
    public required string MfaToken { get; init; }

    /// <summary>An unused backup code, formatted xxxx-xxxx (letters and digits).</summary>
    public required string RecoveryCode { get; init; }
}
