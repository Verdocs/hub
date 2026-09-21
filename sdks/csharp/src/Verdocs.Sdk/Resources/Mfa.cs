using Verdocs.Models;

namespace Verdocs.Resources;

/// <summary>
/// Multi-factor authentication calls, reached through <see cref="VerdocsEndpoint.Mfa"/>.
/// Enrollment is two steps: <see cref="EnrollMfaAsync"/> issues a pending secret, and
/// <see cref="VerifyMfaEnrollmentAsync"/> confirms it with a code and returns the backup codes.
/// </summary>
public sealed class Mfa
{
    private readonly VerdocsEndpoint _endpoint;

    internal Mfa(VerdocsEndpoint endpoint)
    {
        _endpoint = endpoint;
    }

    /// <summary>
    /// Gets the caller's multi-factor authentication status.
    ///
    /// <example>
    /// <code>
    /// var status = await endpoint.Mfa.GetMfaStatusAsync();
    /// if (status.Enabled &amp;&amp; status.BackupCodesRemaining &lt; 3)
    /// {
    ///     // Suggest regenerating backup codes.
    /// }
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The caller's MFA status.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the session is invalid.</exception>
    /// <sdkOperation>mfa.getMFAStatus</sdkOperation>
    /// <sdkGroup>MFA</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<MfaStatus> GetMfaStatusAsync(CancellationToken cancellationToken = default)
    {
        return _endpoint.SendAsync<MfaStatus>(HttpMethod.Get, "/v2/users/mfa", null, cancellationToken);
    }

    /// <summary>
    /// Begins MFA enrollment. The returned secret is pending and does not take effect until it
    /// is confirmed with <see cref="VerifyMfaEnrollmentAsync"/>. Render
    /// <see cref="MfaEnrollment.OtpauthUrl"/> as a QR code for authenticator apps, and show
    /// <see cref="MfaEnrollment.Secret"/> for users who need to type it in by hand. Calling
    /// this again replaces the pending secret, so a user who abandons the flow can safely
    /// restart it.
    ///
    /// <example>
    /// <code>
    /// var enrollment = await endpoint.Mfa.EnrollMfaAsync();
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The pending enrollment.</returns>
    /// <exception cref="VerdocsApiException">The call failed; a 400 means MFA is already enabled for the caller.</exception>
    /// <sdkOperation>mfa.enrollMFA</sdkOperation>
    /// <sdkGroup>MFA</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<MfaEnrollment> EnrollMfaAsync(CancellationToken cancellationToken = default)
    {
        return _endpoint.SendAsync<MfaEnrollment>(HttpMethod.Post, "/v2/users/mfa/enroll", null, cancellationToken);
    }

    /// <summary>
    /// Completes MFA enrollment by proving the user can generate codes from the pending
    /// secret. The backup codes are returned once and never again, so show them to the user
    /// before the flow closes. Three incorrect codes discard the pending enrollment and the
    /// user must start over.
    ///
    /// <example>
    /// <code>
    /// var backup = await endpoint.Mfa.VerifyMfaEnrollmentAsync("123456");
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="code">The current six-digit code from the user's authenticator app.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>One-time backup codes, returned only once.</returns>
    /// <exception cref="VerdocsApiException">The code was wrong, the pending enrollment expired, or the call failed.</exception>
    /// <sdkOperation>mfa.verifyMFAEnrollment</sdkOperation>
    /// <sdkGroup>MFA</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<MfaBackupCodes> VerifyMfaEnrollmentAsync(string code, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(code);
        return _endpoint.SendAsync<MfaBackupCodes>(HttpMethod.Post, "/v2/users/mfa/enroll/verify", new { Code = code }, cancellationToken);
    }

    /// <summary>
    /// Replaces the caller's backup codes with a new set. The previous codes stop working
    /// immediately, and the new ones are returned only once.
    ///
    /// <example>
    /// <code>
    /// var backup = await endpoint.Mfa.RegenerateBackupCodesAsync("123456");
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="code">The current six-digit code from the user's authenticator app.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The new one-time backup codes, returned only once.</returns>
    /// <exception cref="VerdocsApiException">The code was wrong or the call failed.</exception>
    /// <sdkOperation>mfa.regenerateBackupCodes</sdkOperation>
    /// <sdkGroup>MFA</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<MfaBackupCodes> RegenerateBackupCodesAsync(string code, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(code);
        return _endpoint.SendAsync<MfaBackupCodes>(HttpMethod.Post, "/v2/users/mfa/backup-codes", new { Code = code }, cancellationToken);
    }

    /// <summary>
    /// Turns off MFA for the caller. A valid code is always required, so knowing the password
    /// alone is not enough to remove the second factor. Either a TOTP code or an unused backup
    /// code is accepted.
    ///
    /// <example>
    /// <code>
    /// await endpoint.Mfa.DisableMfaAsync("123456");
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="code">A current six-digit code from the user's authenticator app, or an unused backup code.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>A task that completes when MFA is disabled.</returns>
    /// <exception cref="VerdocsApiException">The code was wrong or the call failed.</exception>
    /// <sdkOperation>mfa.disableMFA</sdkOperation>
    /// <sdkGroup>MFA</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task DisableMfaAsync(string code, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(code);
        // A DELETE with a JSON body is deliberate: the handler reads the code from the body,
        // mirroring the js-sdk's axios delete with data.
        return _endpoint.SendVoidAsync(HttpMethod.Delete, "/v2/users/mfa", new { Code = code }, cancellationToken);
    }
}
