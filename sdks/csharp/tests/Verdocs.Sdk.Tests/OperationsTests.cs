using System.Net;
using System.Text.Json.Nodes;
using Verdocs.Models;
using Xunit;

namespace Verdocs.Sdk.Tests;

/// <summary>Request shapes and response handling for each shipped operation.</summary>
public sealed class OperationsTests
{
    private const string TestBaseUrl = "https://api.test";

    private static (VerdocsEndpoint Endpoint, FakeHttpMessageHandler Handler) CreateEndpoint()
    {
        var handler = new FakeHttpMessageHandler();
        var client = new HttpClient(handler);
        var endpoint = new VerdocsEndpoint(new VerdocsEndpointOptions { BaseUrl = TestBaseUrl }, client);
        return (endpoint, handler);
    }

    [Fact]
    public async Task AuthenticateAsync_PasswordGrant_PostsSnakeCaseBody()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.OK, SamplePayloads.Auth);

        var response = await endpoint.AuthenticateAsync(
            new PasswordGrantRequest { Username = "test@example.com", Password = "hunter22" },
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Post, request.Method);
        Assert.Equal("/v2/oauth2/token", request.Uri!.AbsolutePath);

        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        Assert.Equal("test@example.com", (string?)body["username"]);
        Assert.Equal("hunter22", (string?)body["password"]);
        Assert.Equal("password", (string?)body["grant_type"]);
        Assert.False(body.ContainsKey("client_id"));
        Assert.False(body.ContainsKey("scope"));

        Assert.Equal("eyJhbGciOiJub25lIn0.eyJzdWIiOiJ1c2VyLTEyMzQifQ.fake", response.AccessToken);
        Assert.Equal(3600, response.ExpiresIn);
    }

    [Fact]
    public void AuthenticateAsync_NullRequest_ThrowsSynchronously()
    {
        var (endpoint, _) = CreateEndpoint();

        // Usage errors throw from the method, not the task, so no await is needed to observe them.
        Assert.Throws<ArgumentNullException>(
            () => { _ = endpoint.AuthenticateAsync(null!, TestContext.Current.CancellationToken); });
    }

    [Fact]
    public async Task AuthenticateAsync_ClientCredentials_PostsGrantBody()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.OK, SamplePayloads.Auth);

        await endpoint.AuthenticateAsync(
            new ClientCredentialsRequest { ClientId = "cid", ClientSecret = "secret" },
            TestContext.Current.CancellationToken);

        var body = Assert.IsType<JsonObject>(JsonNode.Parse(handler.Requests[0].Body!));
        var expected = new Dictionary<string, string?>
        {
            ["grant_type"] = "client_credentials",
            ["client_id"] = "cid",
            ["client_secret"] = "secret",
        };
        Assert.Equal(expected["grant_type"], (string?)body["grant_type"]);
        Assert.Equal(expected["client_id"], (string?)body["client_id"]);
        Assert.Equal(expected["client_secret"], (string?)body["client_secret"]);
    }

    [Fact]
    public async Task AuthenticateAsync_AuthorizationCode_PostsGrantBody()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.OK, SamplePayloads.Auth);

        await endpoint.AuthenticateAsync(
            new AuthorizationCodeRequest
            {
                Code = "auth-code",
                ClientId = "cid",
                ClientSecret = "secret",
                RedirectUri = "https://app.example/callback",
            },
            TestContext.Current.CancellationToken);

        var body = Assert.IsType<JsonObject>(JsonNode.Parse(handler.Requests[0].Body!));
        Assert.Equal("authorization_code", (string?)body["grant_type"]);
        Assert.Equal("auth-code", (string?)body["code"]);
        Assert.Equal("https://app.example/callback", (string?)body["redirect_uri"]);
    }

    [Fact]
    public async Task RefreshTokenAsync_PostsRefreshGrant()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.OK, SamplePayloads.Auth);

        await endpoint.RefreshTokenAsync("refresh-token-value", TestContext.Current.CancellationToken);

        var body = Assert.IsType<JsonObject>(JsonNode.Parse(handler.Requests[0].Body!));
        Assert.Equal("refresh_token", (string?)body["grant_type"]);
        Assert.Equal("refresh-token-value", (string?)body["refresh_token"]);
    }

    [Fact]
    public void GetOAuth2AuthorizeUrl_BuildsAbsoluteUrl()
    {
        var (endpoint, _) = CreateEndpoint();

        var url = endpoint.GetOAuth2AuthorizeUrl(new OAuth2AuthorizeParams
        {
            ClientId = "cid",
            RedirectUri = "https://app.example/callback",
            State = "csrf",
            Scope = "openid",
        });

        var expected =
            "https://api.test/v2/oauth2/authorize"
            + "?client_id=cid"
            + "&redirect_uri=https%3A%2F%2Fapp.example%2Fcallback"
            + "&response_type=code"
            + "&state=csrf"
            + "&scope=openid";
        Assert.Equal(expected, url);
    }

    [Fact]
    public async Task ChangePasswordAsync_PostsBody()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.OK, """{"status":"OK","message":"Password updated"}""");

        var result = await endpoint.ChangePasswordAsync(
            new ChangePasswordRequest { OldPassword = "old", NewPassword = "new" },
            TestContext.Current.CancellationToken);

        Assert.Equal("OK", result.Status);
        var body = Assert.IsType<JsonObject>(JsonNode.Parse(handler.Requests[0].Body!));
        Assert.Equal("old", (string?)body["old_password"]);
        Assert.Equal("new", (string?)body["new_password"]);
    }

    [Fact]
    public async Task ResetPasswordAsync_Initiate_OmitsOptionalFields()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.OK, """{"success":true}""");

        var result = await endpoint.ResetPasswordAsync(
            new ResetPasswordRequest { Email = "you@example.com" },
            TestContext.Current.CancellationToken);

        Assert.True(result.Success);
        var body = Assert.IsType<JsonObject>(JsonNode.Parse(handler.Requests[0].Body!));
        Assert.Equal("you@example.com", (string?)body["email"]);
        Assert.False(body.ContainsKey("code"));
        Assert.False(body.ContainsKey("new_password"));
    }

    [Fact]
    public async Task ResetPasswordAsync_Complete_SendsCodeAndPassword()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.OK, """{"success":true}""");

        await endpoint.ResetPasswordAsync(
            new ResetPasswordRequest { Email = "you@example.com", Code = "123456", NewPassword = "new" },
            TestContext.Current.CancellationToken);

        var body = Assert.IsType<JsonObject>(JsonNode.Parse(handler.Requests[0].Body!));
        Assert.Equal("123456", (string?)body["code"]);
        Assert.Equal("new", (string?)body["new_password"]);
    }

    [Fact]
    public async Task ResendVerificationAsync_WithoutOverride_SendsEmptyBody()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.OK, """{"result":"done"}""");

        var result = await endpoint.ResendVerificationAsync(cancellationToken: TestContext.Current.CancellationToken);

        Assert.Equal("done", result.Result);
        Assert.False(handler.Requests[0].Headers.ContainsKey("Authorization"));
    }

    [Fact]
    public async Task ResendVerificationAsync_WithOverrideToken_SetsAuthorization()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.OK, """{"result":"done"}""");

        await endpoint.ResendVerificationAsync("override-token", TestContext.Current.CancellationToken);

        Assert.Equal("Bearer override-token", handler.Requests[0].Headers["Authorization"]);
    }

    [Fact]
    public async Task VerifyEmailAsync_PostsBodyAndReturnsTokens()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.OK, SamplePayloads.Auth);

        var tokens = await endpoint.VerifyEmailAsync(
            new VerifyEmailRequest { Email = "you@example.com", Token = "verify-token" },
            TestContext.Current.CancellationToken);

        Assert.NotNull(tokens.AccessToken);
        var body = Assert.IsType<JsonObject>(JsonNode.Parse(handler.Requests[0].Body!));
        Assert.Equal("you@example.com", (string?)body["email"]);
        Assert.Equal("verify-token", (string?)body["token"]);
    }

    [Fact]
    public async Task GetMyUserAsync_RequestsUsersMeAndParsesUser()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.OK, SamplePayloads.User);

        var user = await endpoint.GetMyUserAsync(TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Get, request.Method);
        Assert.Equal("/v2/users/me", request.Uri!.PathAndQuery);
        Assert.Equal("test@example.com", user.Email);
        Assert.True(user.EmailVerified);
        // googleId is one of the few camelCase wire names; this guards the JsonPropertyName override.
        Assert.Equal("google-1234567890", user.GoogleId);
        Assert.Equal(new DateTimeOffset(2026, 1, 5, 12, 0, 0, TimeSpan.Zero), user.CreatedAt);
    }

    [Fact]
    public async Task GetCurrentProfileAsync_ReturnsTheCurrentEntry()
    {
        var (endpoint, handler) = CreateEndpoint();
        var other = SamplePayloads.Profile
            .Replace("\"current\": true", "\"current\": false")
            .Replace("0a9e8b1c-2d3e-4f50-8a9b-0c1d2e3f4a5b", "99999999-2d3e-4f50-8a9b-0c1d2e3f4a5b");
        handler.Enqueue(HttpStatusCode.OK, "[" + other + "," + SamplePayloads.Profile + "]");

        var profile = await endpoint.GetCurrentProfileAsync(TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal("/v2/profiles", request.Uri!.PathAndQuery);
        Assert.NotNull(profile);
        Assert.True(profile.Current);
        Assert.Equal("0a9e8b1c-2d3e-4f50-8a9b-0c1d2e3f4a5b", profile.Id);
        Assert.Equal("Test Organization", profile.Organization?.Name);
    }

    [Fact]
    public async Task GetCurrentProfileAsync_NoCurrentEntry_ReturnsNull()
    {
        var (endpoint, handler) = CreateEndpoint();
        var notCurrent = SamplePayloads.Profile.Replace("\"current\": true", "\"current\": false");
        handler.Enqueue(HttpStatusCode.OK, "[" + notCurrent + "]");

        var profile = await endpoint.GetCurrentProfileAsync(TestContext.Current.CancellationToken);

        Assert.Null(profile);
    }

    [Fact]
    public async Task GetTemplatesAsync_NoOptions_RequestsBarePath()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.OK, SamplePayloads.TemplateList);

        await endpoint.GetTemplatesAsync(cancellationToken: TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal("/v2/templates", request.Uri!.PathAndQuery);
    }

    [Fact]
    public async Task GetTemplatesAsync_AllOptions_BuildsSnakeCaseQuery()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.OK, SamplePayloads.TemplateList);

        await endpoint.GetTemplatesAsync(
            new GetTemplatesOptions
            {
                Q = "lease agreement",
                IsStarred = true,
                IsCreator = false,
                Visibility = TemplateVisibilityFilter.PrivateShared,
                SortBy = TemplateSortBy.CreatedAt,
                Ascending = false,
                Rows = 10,
                Page = 2,
            },
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(
            "/v2/templates?q=lease%20agreement&is_starred=true&is_creator=false"
            + "&visibility=private_shared&sort_by=created_at&ascending=false&rows=10&page=2",
            request.Uri!.PathAndQuery);
    }

    [Fact]
    public async Task GetTemplatesAsync_ParsesTemplateList()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.OK, SamplePayloads.TemplateList);

        var list = await endpoint.GetTemplatesAsync(cancellationToken: TestContext.Current.CancellationToken);

        Assert.Equal(2, list.Count);
        Assert.Equal(0, list.Page);
        Assert.Equal(2, list.Templates.Count);
        Assert.Equal("Lease Agreement", list.Templates[0].Name);
        Assert.Null(list.Templates[0].LastUsedAt);
        Assert.Equal(new DateTimeOffset(2026, 2, 1, 10, 0, 0, TimeSpan.Zero), list.Templates[1].LastUsedAt);
        // List entries carry no relations; these stay null rather than empty.
        Assert.Null(list.Templates[0].Roles);
    }

    [Fact]
    public async Task GetTemplateAsync_RequestsTemplateByIdAndParsesRelations()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.OK, SamplePayloads.TemplateDetail);

        var template = await endpoint.GetTemplateAsync(
            "0df79afe-76b9-417f-a1b3-d51c7abffb6f",
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal("/v2/templates/0df79afe-76b9-417f-a1b3-d51c7abffb6f", request.Uri!.PathAndQuery);
        Assert.Equal("Lease Agreement", template.Name);
        var role = Assert.Single(template.Roles!);
        Assert.Equal("Tenant", role.Name);
        var document = Assert.Single(template.Documents!);
        Assert.Equal(3, document.Pages);
        var field = Assert.Single(template.Fields!);
        Assert.Equal("signature", field.Type);
        Assert.Equal(72.5, field.X);
    }

    [Fact]
    public void GetTemplateAsync_EmptyId_ThrowsSynchronously()
    {
        var (endpoint, _) = CreateEndpoint();

        // Usage errors throw from the method, not the task, so no await is needed to observe them.
        Assert.Throws<ArgumentException>(
            () => { _ = endpoint.GetTemplateAsync("", TestContext.Current.CancellationToken); });
    }

    [Fact]
    public async Task CreateTemplateAsync_SendsOnlySetFields_RequestsPostAndParsesResponse()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.OK, SamplePayloads.TemplateCreated);

        var template = await endpoint.CreateTemplateAsync(
            new TemplateCreateParams { Name = "NDA" },
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Post, request.Method);
        Assert.Equal("/v2/templates", request.Uri!.AbsolutePath);

        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        Assert.Equal("NDA", (string?)body["name"]);
        Assert.False(body.ContainsKey("description"));
        Assert.False(body.ContainsKey("visibility"));
        Assert.False(body.ContainsKey("sender"));
        Assert.False(body.ContainsKey("initial_reminder"));

        Assert.Equal("NDA", template.Name);
        Assert.Equal("83da3d70-7857-4392-b876-c4592a304bc9", template.Id);
    }

    [Fact]
    public void CreateTemplateAsync_NullParameters_ThrowsSynchronously()
    {
        var (endpoint, _) = CreateEndpoint();

        Assert.Throws<ArgumentNullException>(
            () => { _ = endpoint.CreateTemplateAsync(null!, TestContext.Current.CancellationToken); });
    }

    [Fact]
    public void CreateTemplateAsync_EmptyName_ThrowsSynchronously()
    {
        var (endpoint, _) = CreateEndpoint();

        Assert.Throws<ArgumentException>(
            () => { _ = endpoint.CreateTemplateAsync(new TemplateCreateParams { Name = "   " }, TestContext.Current.CancellationToken); });
    }
}
