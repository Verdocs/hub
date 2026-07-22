using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json.Nodes;
using Verdocs.Models;
using Xunit;

namespace Verdocs.Sdk.Tests;

/// <summary>Request shapes and response handling for the Templates resource.</summary>
public sealed class TemplatesResourceTests
{
    private const string TestBaseUrl = "https://api.test";

    // Payloads are defined locally; SamplePayloads.cs belongs to another slice.
    private const string TemplateJson = """
    {
      "id": "0df79afe-76b9-417f-a1b3-d51c7abffb6f",
      "profile_id": "6d5eba25-ecb4-4a94-b7d1-a5c22a19d2b9",
      "organization_id": "b2a30b2e-a1a6-4b52-b103-3e4a4c22bba7",
      "sender": "envelope_creator",
      "name": "Lease Agreement",
      "visibility": "private",
      "initial_reminder": null,
      "followup_reminders": null,
      "max_reminder_days": 14,
      "counter": 0,
      "star_counter": 0,
      "is_sendable": false,
      "created_at": "2026-02-01T10:00:00Z",
      "updated_at": "2026-02-01T10:00:00Z"
    }
    """;

    private static (VerdocsEndpoint Endpoint, FakeHttpMessageHandler Handler) CreateEndpoint()
    {
        var handler = new FakeHttpMessageHandler();
        var client = new HttpClient(handler);
        var endpoint = new VerdocsEndpoint(new VerdocsEndpointOptions { BaseUrl = TestBaseUrl }, client);
        return (endpoint, handler);
    }

    [Fact]
    public async Task CreateAsync_JsonBody_PostsSnakeCaseBodyWithInlineRoles()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.OK, TemplateJson);

        var template = await endpoint.Templates.CreateAsync(
            new CreateTemplateRequest
            {
                Name = "Lease Agreement",
                Description = "Standard 12-month lease",
                Visibility = TemplateVisibility.Shared,
                Sender = TemplateSender.EnvelopeCreator,
                InitialReminder = 86_400_000,
                Documents = [new TemplateDocumentSource { Uri = "https://example.com/lease.pdf", Name = "lease.pdf" }],
                Roles = [new CreateRoleRequest { Name = "Tenant", Type = RecipientType.Signer, Sequence = 1, Order = 1 }],
            },
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Post, request.Method);
        Assert.Equal("/v2/templates", request.Uri!.PathAndQuery);

        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        Assert.Equal("Lease Agreement", (string?)body["name"]);
        Assert.Equal("Standard 12-month lease", (string?)body["description"]);
        Assert.Equal("shared", (string?)body["visibility"]);
        Assert.Equal("envelope_creator", (string?)body["sender"]);
        Assert.Equal(86_400_000, (long?)body["initial_reminder"]);

        // The deprecated flags are not part of the port, and fields cannot be created inline
        // (the server discards them), so none of these keys may appear.
        Assert.False(body.ContainsKey("is_personal"));
        Assert.False(body.ContainsKey("is_public"));
        Assert.False(body.ContainsKey("fields"));

        var role = Assert.IsType<JsonObject>(Assert.Single(body["roles"]!.AsArray())!);
        Assert.Equal("Tenant", (string?)role["name"]);
        Assert.Equal("signer", (string?)role["type"]);
        Assert.Equal(1, (int?)role["sequence"]);
        Assert.False(role.ContainsKey("email"));
        Assert.False(role.ContainsKey("name_locked"));

        var document = Assert.IsType<JsonObject>(Assert.Single(body["documents"]!.AsArray())!);
        Assert.Equal("https://example.com/lease.pdf", (string?)document["uri"]);
        Assert.False(document.ContainsKey("data"));

        Assert.Equal("Lease Agreement", template.Name);
    }

    [Fact]
    public async Task CreateAsync_UnsetOptionals_ReminderFieldsStillSerialized()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.OK, TemplateJson);

        await endpoint.Templates.CreateAsync(
            new CreateTemplateRequest { Name = "Minimal" },
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));

        // Null carries meaning for the reminder fields (it disables reminders), so they ride
        // the wire even when unset; every other unset optional stays off it.
        Assert.True(body.ContainsKey("initial_reminder"));
        Assert.Null(body["initial_reminder"]);
        Assert.True(body.ContainsKey("followup_reminders"));
        Assert.Null(body["followup_reminders"]);
        Assert.False(body.ContainsKey("max_reminder_days"));
        Assert.False(body.ContainsKey("description"));
        Assert.False(body.ContainsKey("visibility"));
        Assert.False(body.ContainsKey("sender"));
        Assert.False(body.ContainsKey("documents"));
        Assert.False(body.ContainsKey("roles"));
    }

    [Fact]
    public async Task CreateAsync_MultipartDocuments_SendsFilePartsAndStringParts()
    {
        var (endpoint, handler) = CreateEndpoint();
        string? contentTypeHeader = null;
        handler.Enqueue((request, _) =>
        {
            contentTypeHeader = request.Content?.Headers.ContentType?.ToString();
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(TemplateJson, Encoding.UTF8, "application/json"),
            });
        });

        using var lease = new MemoryStream(Encoding.ASCII.GetBytes("%PDF-1.4 lease"));
        using var addendum = new MemoryStream(Encoding.ASCII.GetBytes("PK docx addendum"));

        var template = await endpoint.Templates.CreateAsync(
            new CreateTemplateRequest { Name = "Lease Agreement", Visibility = TemplateVisibility.Shared },
            [
                new TemplateFileUpload { Content = lease, FileName = "lease.pdf", ContentType = "application/pdf" },
                new TemplateFileUpload
                {
                    Content = addendum,
                    FileName = "addendum.docx",
                    ContentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                },
            ],
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Post, request.Method);
        Assert.Equal("/v2/templates", request.Uri!.PathAndQuery);

        Assert.NotNull(contentTypeHeader);
        var contentType = MediaTypeHeaderValue.Parse(contentTypeHeader);
        Assert.Equal("multipart/form-data", contentType.MediaType);
        var boundary = Assert.Single(contentType.Parameters, parameter => parameter.Name == "boundary").Value!.Trim('"');
        Assert.False(string.IsNullOrEmpty(boundary));
        Assert.StartsWith("--" + boundary, request.Body!);

        // Every file part is named "documents" (the name is repeatable); text parts carry the
        // string-typed create fields only.
        Assert.Equal(2, CountOccurrences(request.Body!, "name=\"documents\""));
        Assert.Contains("name=\"name\"", request.Body);
        Assert.Contains("Lease Agreement", request.Body);
        Assert.Contains("name=\"visibility\"", request.Body);
        Assert.Contains("shared", request.Body);
        Assert.Contains("filename=\"lease.pdf\"", request.Body);
        Assert.Contains("Content-Type: application/pdf", request.Body);
        Assert.Contains("filename=\"addendum.docx\"", request.Body);
        Assert.Contains("Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document", request.Body);
        Assert.Contains("%PDF-1.4 lease", request.Body);
        Assert.DoesNotContain("name=\"description\"", request.Body);

        Assert.Equal("Lease Agreement", template.Name);
    }

    [Fact]
    public void CreateAsync_MultipartWithRoles_ThrowsSynchronously()
    {
        var (endpoint, _) = CreateEndpoint();
        using var file = new MemoryStream(Encoding.ASCII.GetBytes("%PDF-1.4"));

        // Roles cannot ride multipart (text parts are strings only), so this is a usage error
        // that throws from the method rather than the task.
        Assert.Throws<ArgumentException>(() =>
        {
            _ = endpoint.Templates.CreateAsync(
                new CreateTemplateRequest
                {
                    Name = "Lease Agreement",
                    Roles = [new CreateRoleRequest { Name = "Tenant" }],
                },
                [new TemplateFileUpload { Content = file, FileName = "lease.pdf", ContentType = "application/pdf" }],
                TestContext.Current.CancellationToken);
        });
    }

    [Fact]
    public void CreateAsync_MultipartWithNoDocuments_ThrowsSynchronously()
    {
        var (endpoint, _) = CreateEndpoint();

        Assert.Throws<ArgumentException>(() =>
        {
            _ = endpoint.Templates.CreateAsync(
                new CreateTemplateRequest { Name = "Lease Agreement" },
                Array.Empty<TemplateFileUpload>(),
                TestContext.Current.CancellationToken);
        });
    }

    [Fact]
    public async Task UpdateAsync_PatchesTemplateWithAlwaysSerializedReminders()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.OK, TemplateJson);

        await endpoint.Templates.UpdateAsync(
            "0df79afe-76b9-417f-a1b3-d51c7abffb6f",
            new UpdateTemplateRequest { Name = "Renamed", MaxReminderDays = 30 },
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Patch, request.Method);
        Assert.Equal("/v2/templates/0df79afe-76b9-417f-a1b3-d51c7abffb6f", request.Uri!.PathAndQuery);

        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        Assert.Equal("Renamed", (string?)body["name"]);
        Assert.Equal(30, (int?)body["max_reminder_days"]);
        Assert.True(body.ContainsKey("initial_reminder"));
        Assert.Null(body["initial_reminder"]);
        Assert.True(body.ContainsKey("followup_reminders"));
        Assert.Null(body["followup_reminders"]);
        Assert.False(body.ContainsKey("description"));
        Assert.False(body.ContainsKey("visibility"));
    }

    [Fact]
    public async Task DeleteAsync_SendsDeleteAndIgnoresBareStringResponse()
    {
        var (endpoint, handler) = CreateEndpoint();
        // The live endpoint answers deletes with a bare success string, not JSON.
        handler.Enqueue(HttpStatusCode.OK, "Deleted");

        await endpoint.Templates.DeleteAsync("0df79afe-76b9-417f-a1b3-d51c7abffb6f", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Delete, request.Method);
        Assert.Equal("/v2/templates/0df79afe-76b9-417f-a1b3-d51c7abffb6f", request.Uri!.PathAndQuery);
    }

    [Fact]
    public async Task DuplicateAsync_PutsDuplicateActionBody()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.OK, TemplateJson);

        var copy = await endpoint.Templates.DuplicateAsync(
            "0df79afe-76b9-417f-a1b3-d51c7abffb6f",
            "My Template Copy",
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Put, request.Method);
        Assert.Equal("/v2/templates/0df79afe-76b9-417f-a1b3-d51c7abffb6f", request.Uri!.PathAndQuery);

        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        Assert.Equal("duplicate", (string?)body["action"]);
        Assert.Equal("My Template Copy", (string?)body["name"]);
        Assert.Equal("Lease Agreement", copy.Name);
    }

    [Fact]
    public async Task CreateFromSharepointAsync_PostsCamelCaseBody()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.OK, TemplateJson);

        await endpoint.Templates.CreateFromSharepointAsync(
            new CreateTemplateFromSharepointRequest
            {
                Name = "From Sharepoint",
                SiteId = "site-1",
                ItemId = "item-1",
                OboToken = "obo-token",
            },
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Post, request.Method);
        Assert.Equal("/v2/templates/from-sharepoint", request.Uri!.PathAndQuery);

        // The js-sdk sends these fields camelCase; this guards the JsonPropertyName overrides
        // against the snake_case policy.
        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        Assert.Equal("site-1", (string?)body["siteId"]);
        Assert.Equal("item-1", (string?)body["itemId"]);
        Assert.Equal("obo-token", (string?)body["oboToken"]);
        Assert.False(body.ContainsKey("site_id"));
    }

    [Fact]
    public async Task ToggleStarAsync_PostsStarsTogglePath()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.OK, TemplateJson);

        await endpoint.Templates.ToggleStarAsync("0df79afe-76b9-417f-a1b3-d51c7abffb6f", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Post, request.Method);
        Assert.Equal("/v2/templates/0df79afe-76b9-417f-a1b3-d51c7abffb6f/stars/toggle", request.Uri!.PathAndQuery);
    }

    private static int CountOccurrences(string haystack, string needle)
    {
        var count = 0;
        var index = 0;
        while ((index = haystack.IndexOf(needle, index, StringComparison.Ordinal)) >= 0)
        {
            count++;
            index += needle.Length;
        }

        return count;
    }
}
