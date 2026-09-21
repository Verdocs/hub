using System.Buffers.Text;
using System.Security.Cryptography;
using System.Text;

namespace Verdocs.Utils;

/// <summary>
/// PKCE helpers (RFC 7636) for the social sign-in flow started by
/// <see cref="Resources.Auth.GetSocialLoginUrl"/> and finished with a
/// <see cref="Models.LoginCodeGrantRequest"/>.
/// </summary>
public static class Pkce
{
    /// <summary>
    /// Creates a PKCE code verifier: 43 characters of URL-safe randomness (32 random bytes,
    /// base64url encoded). Keep it where it will survive the round trip to the provider, pass
    /// its challenge to <see cref="Resources.Auth.GetSocialLoginUrl"/>, and send it back with
    /// the login-code grant.
    ///
    /// <example>
    /// <code>
    /// var verifier = Pkce.CreateCodeVerifier();
    /// </code>
    /// </example>
    /// </summary>
    /// <returns>A new random verifier.</returns>
    /// <sdkOperation>auth.createCodeVerifier</sdkOperation>
    /// <sdkGroup>Auth</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
    public static string CreateCodeVerifier()
    {
        return Base64Url.EncodeToString(RandomNumberGenerator.GetBytes(32));
    }

    /// <summary>
    /// Creates the PKCE code challenge for a verifier: the base64url-encoded SHA-256 of it,
    /// without padding. Pure computation, so it is synchronous.
    ///
    /// <example>
    /// <code>
    /// var verifier = Pkce.CreateCodeVerifier();
    /// var challenge = Pkce.CreateCodeChallenge(verifier);
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="verifier">The verifier from <see cref="CreateCodeVerifier"/>.</param>
    /// <returns>The S256 challenge to send as code_challenge.</returns>
    /// <sdkOperation>auth.createCodeChallenge</sdkOperation>
    /// <sdkGroup>Auth</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
    public static string CreateCodeChallenge(string verifier)
    {
        ArgumentException.ThrowIfNullOrEmpty(verifier);
        return Base64Url.EncodeToString(SHA256.HashData(Encoding.UTF8.GetBytes(verifier)));
    }
}
