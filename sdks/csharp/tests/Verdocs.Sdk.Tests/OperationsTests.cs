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
            new AuthenticateRequest { Username = "test@example.com", Password = "hunter22" },
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
}
