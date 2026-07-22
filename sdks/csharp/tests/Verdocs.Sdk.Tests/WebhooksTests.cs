using System.Net;
using System.Text.Json.Nodes;
using Verdocs.Models;
using Xunit;

namespace Verdocs.Sdk.Tests;

/// <summary>Request shapes and response handling for the Webhooks resource.</summary>
public sealed class WebhooksTests
{
    private const string TestBaseUrl = "https://api.test";

    private const string WebhookJson = """
        {
          "id": "wh-1",
          "organization_id": "org-1",
          "url": "https://hooks.example.com/verdocs",
          "auth_method": "hmac",
          "active": true,
          "secret_key": "...cdef",
          "events": {"envelope_created": true, "envelope_completed": false}
        }
        """;

    private static (Verdocs.Resources.Webhooks Webhooks, FakeHttpMessageHandler Handler) CreateResource()
    {
        var handler = new FakeHttpMessageHandler();
        var client = new HttpClient(handler);
        var endpoint = new VerdocsEndpoint(new VerdocsEndpointOptions { BaseUrl = TestBaseUrl }, client);
        return (new Verdocs.Resources.Webhooks(endpoint), handler);
    }

    [Fact]
    public async Task GetAsync_RequestsWebhooksPath_ParsesConfiguration()
    {
        var (webhooks, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, WebhookJson);

        var webhook = await webhooks.GetAsync(TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Get, request.Method);
        Assert.Equal("/v2/webhooks", request.Uri!.PathAndQuery);
        Assert.True(webhook.Active);
        Assert.Equal(WebhookAuthMethod.Hmac, webhook.AuthMethod);
        Assert.True(webhook.Events[WebhookEvent.EnvelopeCreated]);
        Assert.False(webhook.Events[WebhookEvent.EnvelopeCompleted]);
    }

    [Fact]
    public async Task SetAsync_PatchesConfigWithEventsMap()
    {
        var (webhooks, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, WebhookJson);

        await webhooks.SetAsync(
            new SetWebhookRequest
            {
                Url = "https://hooks.example.com/verdocs",
                Active = true,
                AuthMethod = WebhookAuthMethod.Hmac,
                Events = new Dictionary<string, bool>
                {
                    [WebhookEvent.EnvelopeCreated] = true,
                    [WebhookEvent.EnvelopeCompleted] = false,
                },
            },
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Patch, request.Method);
        Assert.Equal("/v2/webhooks", request.Uri!.PathAndQuery);

        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        Assert.Equal("https://hooks.example.com/verdocs", (string?)body["url"]);
        Assert.True((bool?)body["active"]);
        Assert.Equal("hmac", (string?)body["auth_method"]);
        Assert.False(body.ContainsKey("client_id"));

        // Event names are dictionary keys, so they must reach the wire untouched by the
        // snake_case property policy.
        var events = Assert.IsType<JsonObject>(body["events"]);
        Assert.True((bool?)events["envelope_created"]);
        Assert.False((bool?)events["envelope_completed"]);
    }

    [Fact]
    public void SetAsync_NullRequest_ThrowsSynchronously()
    {
        var (webhooks, _) = CreateResource();

        Assert.Throws<ArgumentNullException>(
            () => { _ = webhooks.SetAsync(null!, TestContext.Current.CancellationToken); });
    }

    [Fact]
    public async Task RotateSecretAsync_PutsRotateSecretPath_ParsesSecret()
    {
        var (webhooks, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, WebhookJson.Replace("...cdef", "new-secret-key"));

        var webhook = await webhooks.RotateSecretAsync(TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Put, request.Method);
        Assert.Equal("/v2/webhooks/rotate-secret", request.Uri!.PathAndQuery);
        Assert.Null(request.Body);
        Assert.Equal("new-secret-key", webhook.SecretKey);
    }
}
