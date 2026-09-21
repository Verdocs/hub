using System.Net;
using System.Text.Json.Nodes;
using Verdocs.Models;
using Xunit;

namespace Verdocs.Sdk.Tests;

/// <summary>Request shapes and response handling for the Auth resource.</summary>
public sealed class AuthResourceTests
{
    private const string TestBaseUrl = "https://api.test";

    // Payloads live in this file on purpose; SamplePayloads.cs belongs to another slice.
    private const string AuthPayload = """
        {
          "access_token": "access-1",
          "id_token": "id-1",
          "refresh_token": "refresh-1",
          "expires_in": 86400,
          "access_token_exp": 1767171600,
          "refresh_token_exp": 1769763600
        }
        """;

    private const string StatusOkPayload = """{"status": "OK"}""";

    private static (VerdocsEndpoint Endpoint, FakeHttpMessageHandler Handler) CreateEndpoint()
    {
        var handler = new FakeHttpMessageHandler();
        var client = new HttpClient(handler);
        var endpoint = new VerdocsEndpoint(new VerdocsEndpointOptions { BaseUrl = TestBaseUrl }, client);
        return (endpoint, handler);
    }

    [Theory]
    [InlineData("password")]
    [InlineData("client_credentials")]
    [InlineData("refresh_token")]
    [InlineData("authorization_code")]
    [InlineData("urn:verdocs:params:oauth:grant-type:mfa-otp")]
    [InlineData("urn:verdocs:params:oauth:grant-type:mfa-recovery-code")]
    [InlineData("urn:verdocs:params:oauth:grant-type:login-code")]
    public async Task AuthenticateAsync_AnyGrant_SendsGrantTypeDiscriminator(string grantType)
    {
        // System.Text.Json only writes the grant_type discriminator when the request is serialized
        // as the polymorphic base type. Serializing the concrete subtype drops it and the token
        // endpoint answers 400, so pin the wire shape for every grant.
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.OK, AuthPayload);

        AuthenticateRequest request = grantType switch
        {
            "password" => new PasswordGrantRequest { Username = "you@example.com", Password = "secret" },
            "client_credentials" => new ClientCredentialsRequest { ClientId = "client-1", ClientSecret = "secret-1" },
            "refresh_token" => new RefreshTokenGrantRequest { RefreshToken = "refresh-1" },
            "urn:verdocs:params:oauth:grant-type:mfa-otp" => new MfaOtpGrantRequest { MfaToken = "mfa-1", Otp = "123456" },
            "urn:verdocs:params:oauth:grant-type:mfa-recovery-code" => new MfaRecoveryCodeGrantRequest { MfaToken = "mfa-1", RecoveryCode = "abcd-1234" },
            "urn:verdocs:params:oauth:grant-type:login-code" => new LoginCodeGrantRequest { LoginCode = "login-1", CodeVerifier = "verifier-1" },
            _ => new AuthorizationCodeRequest
            {
                Code = "code-1",
                ClientId = "client-1",
                ClientSecret = "secret-1",
                RedirectUri = "https://example.com/cb",
            },
        };

        await endpoint.Auth.AuthenticateAsync(request, TestContext.Current.CancellationToken);

        var captured = Assert.Single(handler.Requests);
        Assert.Equal("/v2/oauth2/token", captured.Uri!.PathAndQuery);
        var body = Assert.IsType<JsonObject>(JsonNode.Parse(captured.Body!));
        Assert.Equal(grantType, (string?)body["grant_type"]);
    }

    [Fact]
    public async Task AuthenticateAsync_MfaOtpGrant_SendsMfaTokenAndOtp()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.OK, AuthPayload);

        var response = await endpoint.Auth.AuthenticateAsync(
            new MfaOtpGrantRequest { MfaToken = "mfa-1", Otp = "123456" },
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Post, request.Method);
        Assert.Equal("/v2/oauth2/token", request.Uri!.PathAndQuery);
        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        Assert.Equal("urn:verdocs:params:oauth:grant-type:mfa-otp", (string?)body["grant_type"]);
        Assert.Equal("mfa-1", (string?)body["mfa_token"]);
        Assert.Equal("123456", (string?)body["otp"]);
        Assert.Equal(3, body.Count);

        Assert.Equal("access-1", response.AccessToken);
    }

    [Fact]
    public async Task AuthenticateAsync_MfaRecoveryCodeGrant_SendsMfaTokenAndRecoveryCode()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.OK, AuthPayload);

        await endpoint.Auth.AuthenticateAsync(
            new MfaRecoveryCodeGrantRequest { MfaToken = "mfa-1", RecoveryCode = "abcd-1234" },
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        Assert.Equal("urn:verdocs:params:oauth:grant-type:mfa-recovery-code", (string?)body["grant_type"]);
        Assert.Equal("mfa-1", (string?)body["mfa_token"]);
        Assert.Equal("abcd-1234", (string?)body["recovery_code"]);
        Assert.Equal(3, body.Count);
    }

    [Fact]
    public async Task AuthenticateAsync_LoginCodeGrant_SendsLoginCodeAndVerifier()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.OK, AuthPayload);

        await endpoint.Auth.AuthenticateAsync(
            new LoginCodeGrantRequest { LoginCode = "login-1", CodeVerifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk" },
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        Assert.Equal("urn:verdocs:params:oauth:grant-type:login-code", (string?)body["grant_type"]);
        Assert.Equal("login-1", (string?)body["login_code"]);
        Assert.Equal("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk", (string?)body["code_verifier"]);
        Assert.Equal(3, body.Count);
    }

    [Fact]
    public async Task AuthenticateAsync_MfaRequiredChallenge_ThrowsMfaRequiredException()
    {
        var (endpoint, handler) = CreateEndpoint();
        const string challengeBody = """{"error":"mfa_required","error_description":"Multi-factor authentication required","mfa_token":"mfa-1"}""";
        handler.Enqueue(HttpStatusCode.Forbidden, challengeBody);

        var exception = await Assert.ThrowsAsync<MfaRequiredException>(
            () => endpoint.Auth.AuthenticateAsync(
                new PasswordGrantRequest { Username = "you@example.com", Password = "secret" },
                TestContext.Current.CancellationToken));

        Assert.Equal("mfa-1", exception.MfaToken);
        Assert.Equal("Multi-factor authentication required", exception.ErrorDescription);
        Assert.Equal("Multi-factor authentication required", exception.Message);
        // The base-type contract still holds so a catch of VerdocsApiException sees the real 403.
        Assert.Equal(HttpStatusCode.Forbidden, exception.StatusCode);
        Assert.Equal(challengeBody, exception.ResponseBody);
        Assert.IsAssignableFrom<VerdocsApiException>(exception);
    }

    [Fact]
    public async Task AuthenticateAsync_MfaRequiredWithoutDescription_UsesDefaultMessage()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.Forbidden, """{"error":"mfa_required","mfa_token":"mfa-1"}""");

        var exception = await Assert.ThrowsAsync<MfaRequiredException>(
            () => endpoint.Auth.AuthenticateAsync(
                new PasswordGrantRequest { Username = "you@example.com", Password = "secret" },
                TestContext.Current.CancellationToken));

        Assert.Equal("mfa-1", exception.MfaToken);
        Assert.Null(exception.ErrorDescription);
        Assert.Contains("Multi-factor authentication is required", exception.Message, StringComparison.Ordinal);
    }

    [Theory]
    [InlineData("""{"error":"invalid_grant"}""")]
    [InlineData("""{"error":"mfa_required"}""")]
    [InlineData("""{"error":"mfa_required","mfa_token":123}""")]
    [InlineData("not json")]
    public async Task AuthenticateAsync_OtherForbidden_ThrowsPlainVerdocsApiException(string body)
    {
        // The challenge needs error "mfa_required" plus a string mfa_token, the same test the
        // js-sdk's isMFARequired applies; anything else on a 403 is an ordinary failure.
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.Forbidden, body);

        var exception = await Assert.ThrowsAsync<VerdocsApiException>(
            () => endpoint.Auth.AuthenticateAsync(
                new PasswordGrantRequest { Username = "you@example.com", Password = "secret" },
                TestContext.Current.CancellationToken));

        Assert.IsNotType<MfaRequiredException>(exception);
        Assert.Equal(HttpStatusCode.Forbidden, exception.StatusCode);
        Assert.Equal(body, exception.ResponseBody);
    }

    [Fact]
    public async Task AuthenticateAsync_MfaRequiredOnNonForbiddenStatus_ThrowsPlainVerdocsApiException()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.BadRequest, """{"error":"mfa_required","mfa_token":"mfa-1"}""");

        var exception = await Assert.ThrowsAsync<VerdocsApiException>(
            () => endpoint.Auth.AuthenticateAsync(
                new PasswordGrantRequest { Username = "you@example.com", Password = "secret" },
                TestContext.Current.CancellationToken));

        Assert.IsNotType<MfaRequiredException>(exception);
        Assert.Equal(HttpStatusCode.BadRequest, exception.StatusCode);
    }

    [Fact]
    public void AuthenticateAsync_NullRequest_ThrowsSynchronously()
    {
        var (endpoint, _) = CreateEndpoint();

        Assert.Throws<ArgumentNullException>(
            () => { _ = endpoint.Auth.AuthenticateAsync(null!, TestContext.Current.CancellationToken); });
    }

    [Fact]
    public async Task GetSocialProvidersAsync_RequestsProvidersPath_ParsesFlags()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.OK, """{"google": true, "microsoft": false}""");

        var providers = await endpoint.Auth.GetSocialProvidersAsync(TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Get, request.Method);
        Assert.Equal("/v2/oauth2/social/providers", request.Uri!.PathAndQuery);
        Assert.Null(request.Body);

        Assert.True(providers.Google);
        Assert.False(providers.Microsoft);
    }

    [Fact]
    public void GetSocialLoginUrl_AllParams_BuildsEscapedUrl()
    {
        var (endpoint, handler) = CreateEndpoint();

        var url = endpoint.Auth.GetSocialLoginUrl(
            SocialLoginProvider.Google,
            "https://your-app.com/login",
            "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
            "csrf token");

        Assert.Equal(
            "https://api.test/v2/oauth2/social/google/start?return_uri=https%3A%2F%2Fyour-app.com%2Flogin"
            + "&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"
            + "&code_challenge_method=S256&state=csrf%20token",
            url);

        // Pure URL builder: nothing goes over the wire.
        Assert.Empty(handler.Requests);
    }

    [Fact]
    public void GetSocialLoginUrl_MicrosoftProvider_UsesProviderPath()
    {
        var (endpoint, _) = CreateEndpoint();

        var url = endpoint.Auth.GetSocialLoginUrl(SocialLoginProvider.Microsoft, "https://your-app.com/login", "challenge", "state");

        Assert.StartsWith("https://api.test/v2/oauth2/social/microsoft/start?", url, StringComparison.Ordinal);
    }

    [Theory]
    [InlineData("", "https://your-app.com/login", "challenge", "state")]
    [InlineData("google", "", "challenge", "state")]
    [InlineData("google", "https://your-app.com/login", "", "state")]
    [InlineData("google", "https://your-app.com/login", "challenge", "")]
    public void GetSocialLoginUrl_MissingParam_ThrowsSynchronously(string provider, string returnUri, string codeChallenge, string state)
    {
        var (endpoint, _) = CreateEndpoint();

        Assert.Throws<ArgumentException>(
            () => endpoint.Auth.GetSocialLoginUrl(provider, returnUri, codeChallenge, state));
    }

    [Fact]
    public async Task ChangePasswordAsync_PostsOldAndNewPasswords()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.OK, StatusOkPayload);

        var response = await endpoint.Auth.ChangePasswordAsync(
            new ChangePasswordRequest { OldPassword = "hunter22", NewPassword = "hunter23" },
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Post, request.Method);
        Assert.Equal("/v2/users/change-password", request.Uri!.PathAndQuery);

        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        Assert.Equal("hunter22", (string?)body["old_password"]);
        Assert.Equal("hunter23", (string?)body["new_password"]);

        Assert.Equal(RequestStatus.Ok, response.Status);
        // The deployed handler answers {status: "OK"} with no message on success.
        Assert.Null(response.Message);
    }

    [Fact]
    public void ChangePasswordAsync_NullRequest_ThrowsSynchronously()
    {
        var (endpoint, _) = CreateEndpoint();

        Assert.Throws<ArgumentNullException>(
            () => { _ = endpoint.Auth.ChangePasswordAsync(null!, TestContext.Current.CancellationToken); });
    }

    [Fact]
    public async Task RefreshTokenAsync_PostsRefreshGrantBody()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.OK, AuthPayload);

        var response = await endpoint.Auth.RefreshTokenAsync("refresh-old", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Post, request.Method);
        Assert.Equal("/v2/oauth2/token", request.Uri!.PathAndQuery);

        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        Assert.Equal("refresh_token", (string?)body["grant_type"]);
        Assert.Equal("refresh-old", (string?)body["refresh_token"]);
        // The deployed refresh schema consumes exactly these two fields.
        Assert.Equal(2, body.Count);

        Assert.Equal("access-1", response.AccessToken);
        Assert.Equal("refresh-1", response.RefreshToken);
    }

    [Fact]
    public void RefreshTokenAsync_EmptyToken_ThrowsSynchronously()
    {
        var (endpoint, _) = CreateEndpoint();

        Assert.Throws<ArgumentException>(
            () => { _ = endpoint.Auth.RefreshTokenAsync("", TestContext.Current.CancellationToken); });
    }

    [Fact]
    public async Task ResetPasswordAsync_InitiateStep_OmitsCodeAndNewPassword()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.OK, """{"status": "OK", "message": "Please check your email for reset instructions."}""");

        var response = await endpoint.Auth.ResetPasswordAsync(
            new ResetPasswordRequest { Email = "test@example.com" },
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Post, request.Method);
        Assert.Equal("/v2/users/reset-password", request.Uri!.PathAndQuery);

        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        Assert.Equal("test@example.com", (string?)body["email"]);
        Assert.False(body.ContainsKey("code"));
        Assert.False(body.ContainsKey("new_password"));

        Assert.Equal(RequestStatus.Ok, response.Status);
        Assert.Equal("Please check your email for reset instructions.", response.Message);
    }

    [Fact]
    public async Task ResetPasswordAsync_CompleteStep_SendsCodeAndNewPassword()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.OK, StatusOkPayload);

        var response = await endpoint.Auth.ResetPasswordAsync(
            new ResetPasswordRequest { Email = "test@example.com", Code = "123456", NewPassword = "hunter23" },
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        Assert.Equal("test@example.com", (string?)body["email"]);
        Assert.Equal("123456", (string?)body["code"]);
        Assert.Equal("hunter23", (string?)body["new_password"]);

        Assert.Equal(RequestStatus.Ok, response.Status);
        Assert.Null(response.Message);
    }

    [Fact]
    public void ResetPasswordAsync_NullRequest_ThrowsSynchronously()
    {
        var (endpoint, _) = CreateEndpoint();

        Assert.Throws<ArgumentNullException>(
            () => { _ = endpoint.Auth.ResetPasswordAsync(null!, TestContext.Current.CancellationToken); });
    }

    [Fact]
    public async Task ResendVerificationAsync_PostsEmptyObjectWithSessionToken()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.OK, StatusOkPayload);

        // The post-signup partial session is applied like any other token.
        var token = TestTokens.Create();
        endpoint.SetToken(token);

        await endpoint.Auth.ResendVerificationAsync(TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Post, request.Method);
        Assert.Equal("/v2/users/resend-verification", request.Uri!.PathAndQuery);
        Assert.Equal("{}", request.Body);
        Assert.Equal("Bearer " + token, request.Headers["Authorization"]);
    }

    [Fact]
    public async Task VerifyEmailAsync_PostsEmailAndToken_ReturnsNewTokens()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.OK, AuthPayload);

        // Weekend finding 1: the deployed API requires the partial-session bearer token from
        // signup here, so the test models the real calling pattern.
        var token = TestTokens.Create();
        endpoint.SetToken(token);

        var response = await endpoint.Auth.VerifyEmailAsync(
            new VerifyEmailRequest { Email = "test@example.com", Token = "123456" },
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Post, request.Method);
        Assert.Equal("/v2/users/verify", request.Uri!.PathAndQuery);
        Assert.Equal("Bearer " + token, request.Headers["Authorization"]);

        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        Assert.Equal("test@example.com", (string?)body["email"]);
        Assert.Equal("123456", (string?)body["token"]);

        Assert.Equal("access-1", response.AccessToken);
    }

    [Fact]
    public void VerifyEmailAsync_NullRequest_ThrowsSynchronously()
    {
        var (endpoint, _) = CreateEndpoint();

        Assert.Throws<ArgumentNullException>(
            () => { _ = endpoint.Auth.VerifyEmailAsync(null!, TestContext.Current.CancellationToken); });
    }

    [Fact]
    public void GetOAuth2AuthorizeUrl_AllParams_BuildsEscapedUrl()
    {
        var (endpoint, handler) = CreateEndpoint();

        var url = endpoint.Auth.GetOAuth2AuthorizeUrl(
            "client-1234",
            "https://your-app.com/callback",
            state: "csrf token",
            scope: "all");

        Assert.Equal(
            "https://api.test/v2/oauth2/authorize?client_id=client-1234"
            + "&redirect_uri=https%3A%2F%2Fyour-app.com%2Fcallback"
            + "&response_type=code&state=csrf%20token&scope=all",
            url);

        // Pure URL builder: nothing goes over the wire.
        Assert.Empty(handler.Requests);
    }

    [Fact]
    public void GetOAuth2AuthorizeUrl_NoStateOrScope_OmitsThem()
    {
        var (endpoint, _) = CreateEndpoint();

        // Empty state mirrors the js-sdk's truthiness check: it is omitted, not sent blank.
        var url = endpoint.Auth.GetOAuth2AuthorizeUrl("client-1234", "https://your-app.com/callback", state: "");

        Assert.Equal(
            "https://api.test/v2/oauth2/authorize?client_id=client-1234"
            + "&redirect_uri=https%3A%2F%2Fyour-app.com%2Fcallback"
            + "&response_type=code",
            url);
    }

    [Fact]
    public void GetOAuth2AuthorizeUrl_EmptyClientId_ThrowsSynchronously()
    {
        var (endpoint, _) = CreateEndpoint();

        Assert.Throws<ArgumentException>(
            () => endpoint.Auth.GetOAuth2AuthorizeUrl("", "https://your-app.com/callback"));
    }
}
