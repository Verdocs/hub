using System.Net;
using System.Text.Json.Nodes;
using Verdocs.Models;
using Verdocs.Resources;
using Xunit;

namespace Verdocs.Sdk.Tests;

/// <summary>Request shapes and response handling for the TemplateFields resource.</summary>
public sealed class TemplateFieldsTests
{
    private const string TestBaseUrl = "https://api.test";

    // Payloads are defined locally; SamplePayloads.cs belongs to another slice.
    private const string FieldJson = """
    {
      "name": "Tenant-dropdown-1",
      "role_name": "Tenant 1",
      "template_id": "0df79afe-76b9-417f-a1b3-d51c7abffb6f",
      "document_id": "9a1f21dc-31c7-4d55-95a8-6a0f2f8b1c44",
      "type": "dropdown",
      "required": true,
      "page": 0,
      "x": 72.5,
      "y": 640,
      "width": 120,
      "height": 24,
      "multiline": false,
      "options": [{"id": "opt-yes", "label": "Yes"}, {"id": "opt-no", "label": "No"}]
    }
    """;

    private static (TemplateFields Fields, FakeHttpMessageHandler Handler) CreateResource()
    {
        var handler = new FakeHttpMessageHandler();
        var client = new HttpClient(handler);
        var endpoint = new VerdocsEndpoint(new VerdocsEndpointOptions { BaseUrl = TestBaseUrl }, client);
        // The endpoint property for this resource is wired by the coordinator; tests construct
        // the resource directly through its internal constructor.
        return (new TemplateFields(endpoint), handler);
    }

    [Fact]
    public async Task CreateAsync_PostsSnakeCaseBodyAndOmitsUnsetFields()
    {
        var (fields, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, FieldJson);

        var field = await fields.CreateAsync(
            "0df79afe-76b9-417f-a1b3-d51c7abffb6f",
            new CreateFieldRequest
            {
                Name = "Tenant-dropdown-1",
                RoleName = "Tenant 1",
                DocumentId = "9a1f21dc-31c7-4d55-95a8-6a0f2f8b1c44",
                Type = FieldType.Dropdown,
                Page = 0,
                X = 72.5,
                Y = 640,
                Required = true,
                Options =
                [
                    new DropdownOption { Id = "opt-yes", Label = "Yes" },
                    new DropdownOption { Id = "opt-no", Label = "No" },
                ],
            },
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Post, request.Method);
        Assert.Equal("/v2/fields/0df79afe-76b9-417f-a1b3-d51c7abffb6f", request.Uri!.PathAndQuery);

        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        Assert.Equal("Tenant-dropdown-1", (string?)body["name"]);
        Assert.Equal("Tenant 1", (string?)body["role_name"]);
        Assert.Equal("9a1f21dc-31c7-4d55-95a8-6a0f2f8b1c44", (string?)body["document_id"]);
        Assert.Equal("dropdown", (string?)body["type"]);
        Assert.Equal(0, (int?)body["page"]);
        Assert.Equal(72.5, (double?)body["x"]);
        Assert.Equal(640, (double?)body["y"]);
        Assert.Equal(true, (bool?)body["required"]);

        var options = body["options"]!.AsArray();
        Assert.Equal(2, options.Count);
        Assert.Equal("opt-yes", (string?)options[0]!["id"]);
        Assert.Equal("Yes", (string?)options[0]!["label"]);

        Assert.False(body.ContainsKey("width"));
        Assert.False(body.ContainsKey("label"));
        Assert.False(body.ContainsKey("default"));
        Assert.False(body.ContainsKey("template_id"));

        Assert.Equal("Tenant-dropdown-1", field.Name);
        Assert.Equal("dropdown", field.Type);
    }

    [Fact]
    public async Task UpdateAsync_EncodesFieldNameIntoPath()
    {
        var (fields, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, FieldJson);

        await fields.UpdateAsync(
            "0df79afe-76b9-417f-a1b3-d51c7abffb6f",
            "Tenant dropdown 1",
            new UpdateFieldRequest { X = 100, Y = 200 },
            TestContext.Current.CancellationToken);

        // Field names may contain characters that need URL encoding in the path.
        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Patch, request.Method);
        Assert.Equal("/v2/fields/0df79afe-76b9-417f-a1b3-d51c7abffb6f/Tenant%20dropdown%201", request.Uri!.PathAndQuery);

        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        Assert.Equal(100, (double?)body["x"]);
        Assert.Equal(200, (double?)body["y"]);
        Assert.False(body.ContainsKey("name"));
        Assert.False(body.ContainsKey("role_name"));
        Assert.False(body.ContainsKey("required"));
        Assert.False(body.ContainsKey("options"));
    }

    [Fact]
    public async Task DeleteAsync_EncodesFieldNameIntoPath()
    {
        var (fields, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, "Deleted");

        await fields.DeleteAsync("0df79afe-76b9-417f-a1b3-d51c7abffb6f", "Tenant dropdown 1", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Delete, request.Method);
        Assert.Equal("/v2/fields/0df79afe-76b9-417f-a1b3-d51c7abffb6f/Tenant%20dropdown%201", request.Uri!.PathAndQuery);
    }
}
