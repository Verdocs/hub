using System.Net;
using System.Text.Json.Nodes;
using Verdocs.Models;
using Xunit;

namespace Verdocs.Sdk.Tests;

/// <summary>Request shapes and response handling for the ApiKeys resource.</summary>
public sealed class ApiKeysTests
{
    private const string TestBaseUrl = "https://api.test";

    private const string ApiKeyJson = """
        {
          "client_id": "ck-1",
          "name": "CI key",
          "organization_id": "org-1",
          "profile_id": "prof-1",
          "global_admin": false
        }
        """;

    private static (Verdocs.Resources.ApiKeys ApiKeys, FakeHttpMessageHandler Handler) CreateResource()
    {
        var handler = new FakeHttpMessageHandler();
        var client = new HttpClient(handler);
        var endpoint = new VerdocsEndpoint(new VerdocsEndpointOptions { BaseUrl = TestBaseUrl }, client);
        return (new Verdocs.Resources.ApiKeys(endpoint), handler);
    }

    [Fact]
    public async Task ListAsync_RequestsKeysPath_ParsesKeysWithoutSecrets()
    {
        var (apiKeys, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, "[" + ApiKeyJson + "]");

        var keys = await apiKeys.ListAsync(TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Get, request.Method);
        Assert.Equal("/v2/api-keys", request.Uri!.PathAndQuery);
        var key = Assert.Single(keys);
        Assert.Equal("ck-1", key.ClientId);
        Assert.Null(key.ClientSecret);
    }

    [Fact]
    public async Task CreateAsync_PostsGlobalAdminBody_ParsesSecret()
    {
        var (apiKeys, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK,
            "{" + ApiKeyJson.Trim()[1..^1] + ", \"client_secret\": \"cs-1\"}");

        var key = await apiKeys.CreateAsync(
            new CreateApiKeyRequest { Name = "CI key", ProfileId = "prof-1", GlobalAdmin = true },
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Post, request.Method);
        Assert.Equal("/v2/api-keys", request.Uri!.PathAndQuery);

        // The wire control is global_admin; the js-sdk "permission" field does not exist
        // server-side and is never sent.
        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        Assert.Equal("CI key", (string?)body["name"]);
        Assert.Equal("prof-1", (string?)body["profile_id"]);
        Assert.True((bool?)body["global_admin"]);
        Assert.False(body.ContainsKey("permission"));

        Assert.Equal("cs-1", key.ClientSecret);
    }

    [Fact]
    public void CreateAsync_NullRequest_ThrowsSynchronously()
    {
        var (apiKeys, _) = CreateResource();

        Assert.Throws<ArgumentNullException>(
            () => { _ = apiKeys.CreateAsync(null!, TestContext.Current.CancellationToken); });
    }

    [Fact]
    public async Task RotateAsync_PostsToRotatePath_ParsesNewSecret()
    {
        var (apiKeys, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK,
            "{" + ApiKeyJson.Trim()[1..^1] + ", \"client_secret\": \"cs-2\"}");

        var key = await apiKeys.RotateAsync("ck-1", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Post, request.Method);
        Assert.Equal("/v2/api-keys/ck-1/rotate", request.Uri!.PathAndQuery);
        Assert.Null(request.Body);
        Assert.Equal("cs-2", key.ClientSecret);
    }

    [Fact]
    public async Task UpdateAsync_SendsOnlySetFields()
    {
        var (apiKeys, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, ApiKeyJson);

        await apiKeys.UpdateAsync(
            "ck-1",
            new UpdateApiKeyRequest { Name = "Renamed key" },
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Patch, request.Method);
        Assert.Equal("/v2/api-keys/ck-1", request.Uri!.PathAndQuery);
        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        var property = Assert.Single(body);
        Assert.Equal("name", property.Key);
        Assert.Equal("Renamed key", (string?)property.Value);
    }

    [Fact]
    public async Task DeleteAsync_SendsDeleteToKeyPath()
    {
        var (apiKeys, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, """{"status": "OK"}""");

        await apiKeys.DeleteAsync("ck-1", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Delete, request.Method);
        Assert.Equal("/v2/api-keys/ck-1", request.Uri!.PathAndQuery);
    }
}
