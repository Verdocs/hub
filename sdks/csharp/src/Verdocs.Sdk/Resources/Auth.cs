using System.Net;
using System.Net.Http.Json;
using Verdocs.Models;
using Verdocs.Utils;

namespace Verdocs.Resources;

/// <summary>
/// Authentication calls, reached through <see cref="VerdocsEndpoint.Auth"/>.
/// </summary>
public sealed class Auth
{
    private readonly VerdocsEndpoint _endpoint;

    internal Auth(VerdocsEndpoint endpoint)
    {
        _endpoint = endpoint;
    }

    /// <summary>
    /// Authenticates to Verdocs and returns the session tokens. Pass the
    /// <see cref="AuthenticateRequest"/> subtype for the grant in hand: the password grant for
    /// web and mobile apps, client credentials for server apps (never expose the client secret
    /// in front-end code), the authorization code grant for third-party OAuth2 integrations,
    /// the MFA grants to finish a sign-in that raised <see cref="MfaRequiredException"/>, and
    /// the login-code grant to finish a Google or Microsoft sign-in. Call
    /// <see cref="VerdocsEndpoint.SetToken"/> with the access token to apply it to the endpoint.
    ///
    /// <example>
    /// <code>
    /// // Client-side call, suitable for web and mobile apps:
    /// var auth = await endpoint.Auth.AuthenticateAsync(new PasswordGrantRequest
    /// {
    ///     Username = "you@example.com",
    ///     Password = "PASSWORD",
    /// });
    /// endpoint.SetToken(auth.AccessToken);
    ///
    /// // Server-side call. NEVER EXPOSE ClientSecret IN FRONT-END CODE:
    /// var auth = await endpoint.Auth.AuthenticateAsync(new ClientCredentialsRequest
    /// {
    ///     ClientId = "...",
    ///     ClientSecret = "...",
    /// });
    /// endpoint.SetToken(auth.AccessToken);
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="request">The credentials to authenticate with, one of the grant-specific subtypes.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>Authentication tokens and expiration details.</returns>
    /// <exception cref="MfaRequiredException">The credentials were accepted but the user has MFA enabled; finish the sign-in with an MFA grant carrying the exception's <see cref="MfaRequiredException.MfaToken"/>.</exception>
    /// <exception cref="VerdocsApiException">The API rejected the credentials or the call failed.</exception>
    /// <sdkOperation>auth.authenticate</sdkOperation>
    /// <sdkGroup>Auth</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    /// <sdkGettingStarted />
    public Task<AuthenticateResponse> AuthenticateAsync(AuthenticateRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        // Serialize against the base type on purpose. System.Text.Json only writes the grant_type
        // discriminator when the declared type is the polymorphic base, and the endpoint's usual
        // path serializes whatever concrete runtime type it was handed, which silently drops it and
        // earns a 400 from the token endpoint.
        var content = JsonContent.Create(request, typeof(AuthenticateRequest), mediaType: null, VerdocsJson.Options);
        return AuthenticateCoreAsync(content, cancellationToken);
    }

    private async Task<AuthenticateResponse> AuthenticateCoreAsync(JsonContent content, CancellationToken cancellationToken)
    {
        try
        {
            return await _endpoint.SendAsync<AuthenticateResponse>(HttpMethod.Post, "/v2/oauth2/token", content, cancellationToken)
                .ConfigureAwait(false);
        }
        catch (VerdocsApiException exception) when (exception.StatusCode == HttpStatusCode.Forbidden)
        {
            // MFA flows use a 403 to issue their challenge. Any other 403 is a real failure and
            // rethrows untouched.
            var challenge = MfaRequiredException.FromApiException(exception);
            if (challenge is null)
            {
                throw;
            }

            throw challenge;
        }
    }

    /// <summary>
    /// Builds the URL that starts an OAuth2 authorization code flow. Send the user's browser
    /// there; after they authenticate and authorize, they are redirected to
    /// <paramref name="redirectUri"/> with a code query parameter that a server-side
    /// integration exchanges for tokens. This builds the URL locally and makes no network
    /// call, which is why it is synchronous.
    ///
    /// <example>
    /// <code>
    /// var authorizeUrl = endpoint.Auth.GetOAuth2AuthorizeUrl("YOUR_CLIENT_ID", "https://myapp.example.com/callback");
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="clientId">The client ID of the registered OAuth2 application.</param>
    /// <param name="redirectUri">Where to send the user after authorization. Must match a redirect URI registered for the application.</param>
    /// <param name="state">Opaque value returned unchanged in the redirect, used to prevent CSRF attacks.</param>
    /// <param name="scope">Optional scope to request.</param>
    /// <returns>The authorization URL to redirect the user to.</returns>
    /// <sdkOperation>auth.getOAuth2AuthorizeUrl</sdkOperation>
    /// <sdkGroup>Auth</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public string GetOAuth2AuthorizeUrl(string clientId, string redirectUri, string? state = null, string? scope = null)
    {
        ArgumentException.ThrowIfNullOrEmpty(clientId);
        ArgumentException.ThrowIfNullOrEmpty(redirectUri);

        var query = "client_id=" + Uri.EscapeDataString(clientId)
            + "&redirect_uri=" + Uri.EscapeDataString(redirectUri)
            + "&response_type=code";

        if (!string.IsNullOrEmpty(state))
        {
            query += "&state=" + Uri.EscapeDataString(state);
        }

        if (!string.IsNullOrEmpty(scope))
        {
            query += "&scope=" + Uri.EscapeDataString(scope);
        }

        // AbsoluteUri rather than ToString(): ToString() prefers a human-readable form and
        // can undo the escaping in the query.
        return new Uri(_endpoint.BaseUrl, "/v2/oauth2/authorize?" + query).AbsoluteUri;
    }

    /// <summary>
    /// Exchanges a refresh token for fresh session tokens. Call before the current session
    /// expires. The endpoint does not apply the result automatically; pass the new access
    /// token to <see cref="VerdocsEndpoint.SetToken"/>, matching <see cref="AuthenticateAsync"/>.
    ///
    /// <example>
    /// <code>
    /// var auth = await endpoint.Auth.RefreshTokenAsync(refreshToken);
    /// endpoint.SetToken(auth.AccessToken);
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="refreshToken">The refresh token from an earlier authentication response.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>Fresh authentication tokens and expiration details.</returns>
    /// <exception cref="VerdocsApiException">The API rejected the refresh token or the call failed.</exception>
    /// <sdkOperation>auth.refreshToken</sdkOperation>
    /// <sdkGroup>Auth</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<AuthenticateResponse> RefreshTokenAsync(string refreshToken, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(refreshToken);
        return _endpoint.SendAsync<AuthenticateResponse>(
            HttpMethod.Post,
            "/v2/oauth2/token",
            new { GrantType = "refresh_token", RefreshToken = refreshToken },
            cancellationToken);
    }

    /// <summary>
    /// Changes the caller's password when the old password is known (typically for logged-in
    /// users). Wrong old passwords surface as a <see cref="VerdocsApiException"/>.
    ///
    /// <example>
    /// <code>
    /// await endpoint.Auth.ChangePasswordAsync(new ChangePasswordRequest
    /// {
    ///     OldPassword = "OLD_PASSWORD",
    ///     NewPassword = "NEW_PASSWORD",
    /// });
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="request">The old and new passwords.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The change status; "OK" on success.</returns>
    /// <exception cref="VerdocsApiException">The API rejected the change or the call failed.</exception>
    /// <sdkOperation>auth.changePassword</sdkOperation>
    /// <sdkGroup>Auth</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<ChangePasswordResponse> ChangePasswordAsync(ChangePasswordRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        return _endpoint.SendAsync<ChangePasswordResponse>(HttpMethod.Post, "/v2/users/change-password", request, cancellationToken);
    }

    /// <summary>
    /// Requests or completes a password reset, for when the old password is not known
    /// (typically in login forms). Send only the email first to have a reset code delivered,
    /// then send the email plus the code and the new password to complete the reset.
    ///
    /// <example>
    /// <code>
    /// await endpoint.Auth.ResetPasswordAsync(new ResetPasswordRequest { Email = email });
    ///
    /// // Collect the emailed code and a new password from the user, then:
    /// await endpoint.Auth.ResetPasswordAsync(new ResetPasswordRequest
    /// {
    ///     Email = email,
    ///     Code = code,
    ///     NewPassword = newPassword,
    /// });
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="request">The reset parameters; see <see cref="ResetPasswordRequest"/> for the two-step flow.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The reset status; "OK" on success.</returns>
    /// <exception cref="VerdocsApiException">The API rejected the reset (for example, a bad code) or the call failed.</exception>
    /// <sdkOperation>auth.resetPassword</sdkOperation>
    /// <sdkGroup>Auth</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<ResetPasswordResponse> ResetPasswordAsync(ResetPasswordRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        return _endpoint.SendAsync<ResetPasswordResponse>(HttpMethod.Post, "/v2/users/reset-password", request, cancellationToken);
    }

    /// <summary>
    /// Resends the email-verification message for the current session's user. Intended for
    /// the post-signup state where the caller holds a session but is not yet verified: apply
    /// the access token returned by <see cref="Profiles.CreateAsync"/> with
    /// <see cref="VerdocsEndpoint.SetToken"/>, then call this if the original message was
    /// lost or its code expired.
    ///
    /// <example>
    /// <code>
    /// await endpoint.Auth.ResendVerificationAsync();
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>A task that completes when the message has been queued.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the session is invalid.</exception>
    /// <sdkOperation>auth.resendVerification</sdkOperation>
    /// <sdkGroup>Auth</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task ResendVerificationAsync(CancellationToken cancellationToken = default)
    {
        // The body is an empty JSON object, mirroring the js-sdk; the server reads nothing
        // from it and answers {status: "OK"}, which carries nothing worth returning.
        return _endpoint.SendVoidAsync(HttpMethod.Post, "/v2/users/resend-verification", new { }, cancellationToken);
    }

    /// <summary>
    /// Completes email verification with the code the user received. This call requires the
    /// partial session issued at signup: apply the access token returned by
    /// <see cref="Profiles.CreateAsync"/> with <see cref="VerdocsEndpoint.SetToken"/> before
    /// calling. (The js-sdk documents this endpoint as usable while unauthenticated; the
    /// deployed API rejects that.) Success returns fresh, fully verified session tokens;
    /// apply the new access token with SetToken.
    ///
    /// <example>
    /// <code>
    /// var verified = await endpoint.Auth.VerifyEmailAsync(new VerifyEmailRequest { Email = "you@example.com", Token = code });
    /// endpoint.SetToken(verified.AccessToken);
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="request">The email address and the emailed verification code.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>Fresh authentication tokens for the now-verified session.</returns>
    /// <exception cref="VerdocsApiException">The code was wrong or expired, the session was missing, or the call failed.</exception>
    /// <sdkOperation>auth.verifyEmail</sdkOperation>
    /// <sdkGroup>Auth</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<AuthenticateResponse> VerifyEmailAsync(VerifyEmailRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        return _endpoint.SendAsync<AuthenticateResponse>(HttpMethod.Post, "/v2/users/verify", request, cancellationToken);
    }

    /// <summary>
    /// Gets the identity providers enabled in the current environment. Google and Microsoft
    /// are configured per environment, and a provider that is not configured answers 404 from
    /// its sign-in URL, so call this before rendering provider buttons and hide the ones that
    /// are off.
    ///
    /// <example>
    /// <code>
    /// var providers = await endpoint.Auth.GetSocialProvidersAsync();
    /// if (providers.Google)
    /// {
    ///     // Show the Google button.
    /// }
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The enabled providers.</returns>
    /// <exception cref="VerdocsApiException">The call failed.</exception>
    /// <sdkOperation>auth.getSocialProviders</sdkOperation>
    /// <sdkGroup>Auth</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<SocialProviders> GetSocialProvidersAsync(CancellationToken cancellationToken = default)
    {
        return _endpoint.SendAsync<SocialProviders>(HttpMethod.Get, "/v2/oauth2/social/providers", null, cancellationToken);
    }

    /// <summary>
    /// Builds the URL that starts a Google or Microsoft sign-in. Send the user's browser there.
    /// The provider exchange happens server-side, and the user comes back to
    /// <paramref name="returnUri"/> with login_code and state query parameters. Exchange the
    /// code for tokens with <see cref="AuthenticateAsync"/> using a
    /// <see cref="LoginCodeGrantRequest"/> and the verifier that produced
    /// <paramref name="codeChallenge"/>. This builds the URL locally and makes no network
    /// call, which is why it is synchronous.
    ///
    /// <example>
    /// <code>
    /// // Starting the flow. Keep the verifier and state where they survive the redirect.
    /// var codeVerifier = Pkce.CreateCodeVerifier();
    /// var codeChallenge = Pkce.CreateCodeChallenge(codeVerifier);
    /// var state = Pkce.CreateCodeVerifier();
    /// var loginUrl = endpoint.Auth.GetSocialLoginUrl(SocialLoginProvider.Google, "https://your-app.com/login", codeChallenge, state);
    ///
    /// // Back at the return URI, with ?login_code=...&amp;state=...
    /// var auth = await endpoint.Auth.AuthenticateAsync(new LoginCodeGrantRequest { LoginCode = loginCode, CodeVerifier = codeVerifier });
    /// endpoint.SetToken(auth.AccessToken);
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="provider">The identity provider to sign in with; see <see cref="SocialLoginProvider"/> for known values.</param>
    /// <param name="returnUri">Where to send the user after the provider returns. Must belong to a registered origin.</param>
    /// <param name="codeChallenge">The PKCE challenge from <see cref="Pkce.CreateCodeChallenge"/>, the base64url SHA-256 of the verifier the app keeps.</param>
    /// <param name="state">An opaque value returned unchanged to the app, used to prevent CSRF attacks.</param>
    /// <returns>The sign-in URL to redirect the user to. The challenge method is always S256.</returns>
    /// <sdkOperation>auth.getSocialLoginUrl</sdkOperation>
    /// <sdkGroup>Auth</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public string GetSocialLoginUrl(string provider, string returnUri, string codeChallenge, string state)
    {
        ArgumentException.ThrowIfNullOrEmpty(provider);
        ArgumentException.ThrowIfNullOrEmpty(returnUri);
        ArgumentException.ThrowIfNullOrEmpty(codeChallenge);
        ArgumentException.ThrowIfNullOrEmpty(state);

        var query = "return_uri=" + Uri.EscapeDataString(returnUri)
            + "&code_challenge=" + Uri.EscapeDataString(codeChallenge)
            + "&code_challenge_method=S256"
            + "&state=" + Uri.EscapeDataString(state);

        // AbsoluteUri rather than ToString(), for the same reason as GetOAuth2AuthorizeUrl.
        return new Uri(_endpoint.BaseUrl, "/v2/oauth2/social/" + Uri.EscapeDataString(provider) + "/start?" + query).AbsoluteUri;
    }
}
