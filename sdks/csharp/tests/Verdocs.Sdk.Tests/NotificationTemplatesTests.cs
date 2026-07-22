using System.Net;
using System.Text.Json.Nodes;
using Verdocs.Models;
using Xunit;

namespace Verdocs.Sdk.Tests;

/// <summary>Request shapes and response handling for the NotificationTemplates resource.</summary>
public sealed class NotificationTemplatesTests
{
    private const string TestBaseUrl = "https://api.test";

    private const string NotificationTemplateJson = """
        {
          "id": "nt-1",
          "organization_id": "org-1",
          "type": "email",
          "event_name": "recipient:invited",
          "html_template": "<p>You have been invited to sign.</p>"
        }
        """;

    private static (Verdocs.Resources.NotificationTemplates Templates, FakeHttpMessageHandler Handler) CreateResource()
    {
        var handler = new FakeHttpMessageHandler();
        var client = new HttpClient(handler);
        var endpoint = new VerdocsEndpoint(new VerdocsEndpointOptions { BaseUrl = TestBaseUrl }, client);
        return (new Verdocs.Resources.NotificationTemplates(endpoint), handler);
    }

    [Fact]
    public async Task ListAsync_RequestsTemplatesPath_ParsesList()
    {
        var (templates, handler) = CreateResource();
        // The list endpoint omits the html/text bodies; only the metadata comes back.
        handler.Enqueue(HttpStatusCode.OK, """
            [{"id": "nt-1", "organization_id": "org-1", "type": "email", "event_name": "recipient:invited"}]
            """);

        var list = await templates.ListAsync(TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Get, request.Method);
        Assert.Equal("/v2/notifications/templates", request.Uri!.PathAndQuery);
        var template = Assert.Single(list);
        Assert.Equal(EventName.RecipientInvited, template.EventName);
        Assert.Null(template.HtmlTemplate);
    }

    [Fact]
    public async Task GetAsync_RequestsTemplateById_ParsesBodies()
    {
        var (templates, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, NotificationTemplateJson);

        var template = await templates.GetAsync("nt-1", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal("/v2/notifications/templates/nt-1", request.Uri!.PathAndQuery);
        Assert.Equal("<p>You have been invited to sign.</p>", template.HtmlTemplate);
    }

    [Fact]
    public async Task CreateAsync_PostsTypeEventAndBody()
    {
        var (templates, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, NotificationTemplateJson);

        var template = await templates.CreateAsync(
            new CreateNotificationTemplateRequest
            {
                Type = NotificationType.Email,
                EventName = EventName.RecipientInvited,
                HtmlTemplate = "<p>You have been invited to sign.</p>",
            },
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Post, request.Method);
        Assert.Equal("/v2/notifications/templates", request.Uri!.PathAndQuery);
        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        Assert.Equal(3, body.Count);
        Assert.Equal("email", (string?)body["type"]);
        Assert.Equal("recipient:invited", (string?)body["event_name"]);
        Assert.False(body.ContainsKey("template_id"));
        Assert.Equal("nt-1", template.Id);
    }

    [Fact]
    public void CreateAsync_NullRequest_ThrowsSynchronously()
    {
        var (templates, _) = CreateResource();

        Assert.Throws<ArgumentNullException>(
            () => { _ = templates.CreateAsync(null!, TestContext.Current.CancellationToken); });
    }

    [Fact]
    public async Task UpdateAsync_PatchesBodiesOnly()
    {
        var (templates, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, NotificationTemplateJson);

        await templates.UpdateAsync(
            "nt-1",
            new UpdateNotificationTemplateRequest { TextTemplate = "You have been invited to sign." },
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Patch, request.Method);
        Assert.Equal("/v2/notifications/templates/nt-1", request.Uri!.PathAndQuery);
        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        var property = Assert.Single(body);
        Assert.Equal("text_template", property.Key);
    }

    [Fact]
    public async Task DeleteAsync_SendsDeleteToTemplatePath()
    {
        var (templates, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, """{"status": "OK"}""");

        await templates.DeleteAsync("nt-1", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Delete, request.Method);
        Assert.Equal("/v2/notifications/templates/nt-1", request.Uri!.PathAndQuery);
    }
}
