using System.Net;
using System.Text.Json;

namespace Verdocs;

/// <summary>
/// Thrown by <see cref="Resources.Auth.AuthenticateAsync"/> when the token endpoint answers a
/// sign-in with an MFA challenge. This is not a failure: the credentials were accepted, and
/// the caller finishes the sign-in by collecting a code from the user and calling
/// <see cref="Resources.Auth.AuthenticateAsync"/> again with an
/// <see cref="Models.MfaOtpGrantRequest"/> or <see cref="Models.MfaRecoveryCodeGrantRequest"/>
/// carrying <see cref="MfaToken"/>. It derives from <see cref="VerdocsApiException"/>, so
/// code that catches only the base type still sees the 403 with its body intact.
///
/// <example>
/// <code>
/// try
/// {
///     var auth = await endpoint.Auth.AuthenticateAsync(new PasswordGrantRequest { Username = username, Password = password });
///     endpoint.SetToken(auth.AccessToken);
/// }
/// catch (MfaRequiredException challenge)
/// {
///     // Collect a code from the user, then:
///     var auth = await endpoint.Auth.AuthenticateAsync(new MfaOtpGrantRequest { MfaToken = challenge.MfaToken, Otp = otp });
///     endpoint.SetToken(auth.AccessToken);
/// }
/// </code>
/// </example>
/// </summary>
public sealed class MfaRequiredException : VerdocsApiException
{
    private const string ChallengeError = "mfa_required";

    /// <summary>Creates the exception for an mfa_required challenge.</summary>
    /// <param name="responseBody">The raw 403 response body.</param>
    /// <param name="mfaToken">The challenge token to send back with the MFA grant.</param>
    /// <param name="errorDescription">The server's description of the challenge, if it sent one.</param>
    public MfaRequiredException(string responseBody, string mfaToken, string? errorDescription)
        : base(HttpStatusCode.Forbidden, responseBody, errorDescription ?? "Multi-factor authentication is required to complete this sign-in.")
    {
        MfaToken = mfaToken;
        ErrorDescription = errorDescription;
    }

    /// <summary>The challenge token. Send it back as the mfa_token of the MFA grant that completes the sign-in.</summary>
    public string MfaToken { get; }

    /// <summary>The server's description of the challenge, or null if it sent none.</summary>
    public string? ErrorDescription { get; }

    /// <summary>
    /// Reads an mfa_required challenge out of a failed token call, or returns null when the
    /// failure is anything else. The body must be a 403 carrying error "mfa_required" and a
    /// string mfa_token, the same test the js-sdk's isMFARequired applies.
    /// </summary>
    internal static MfaRequiredException? FromApiException(VerdocsApiException exception)
    {
        if (exception.StatusCode != HttpStatusCode.Forbidden || string.IsNullOrWhiteSpace(exception.ResponseBody))
        {
            return null;
        }

        try
        {
            using var document = JsonDocument.Parse(exception.ResponseBody);
            var root = document.RootElement;
            if (root.ValueKind != JsonValueKind.Object
                || !root.TryGetProperty("error", out var error)
                || error.ValueKind != JsonValueKind.String
                || error.GetString() != ChallengeError
                || !root.TryGetProperty("mfa_token", out var mfaToken)
                || mfaToken.ValueKind != JsonValueKind.String)
            {
                return null;
            }

            var description = root.TryGetProperty("error_description", out var errorDescription) && errorDescription.ValueKind == JsonValueKind.String
                ? errorDescription.GetString()
                : null;

            return new MfaRequiredException(exception.ResponseBody, mfaToken.GetString()!, description);
        }
        catch (JsonException)
        {
            return null;
        }
    }
}
