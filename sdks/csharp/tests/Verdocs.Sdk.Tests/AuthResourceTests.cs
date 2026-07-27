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
