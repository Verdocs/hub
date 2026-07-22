using System.Net;
using System.Text.Json.Nodes;
using Verdocs.Models;
using Verdocs.Resources;
using Xunit;

namespace Verdocs.Sdk.Tests;

/// <summary>Request shapes and response handling for the TemplateRoles resource.</summary>
public sealed class TemplateRolesTests
{
    private const string TestBaseUrl = "https://api.test";

    // Payloads are defined locally; SamplePayloads.cs belongs to another slice.
    private const string RoleJson = """
    {
      "template_id": "0df79afe-76b9-417f-a1b3-d51c7abffb6f",
      "name": "Tenant 1",
      "type": "signer",
      "full_name": null,
      "first_name": null,
      "last_name": null,
      "email": null,
      "phone": null,
      "message": null,
      "sequence": 1,
      "order": 1,
      "delegator": false,
      "name_locked": false
    }
    """;

    private static (TemplateRoles Roles, FakeHttpMessageHandler Handler) CreateResource()
    {
        var handler = new FakeHttpMessageHandler();
        var client = new HttpClient(handler);
        var endpoint = new VerdocsEndpoint(new VerdocsEndpointOptions { BaseUrl = TestBaseUrl }, client);
        // The endpoint property for this resource is wired by the coordinator; tests construct
        // the resource directly through its internal constructor.
        return (new TemplateRoles(endpoint), handler);
    }

    [Fact]
    public async Task CreateAsync_PostsSnakeCaseBodyAndOmitsUnsetFields()
    {
        var (roles, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, RoleJson);

        var role = await roles.CreateAsync(
            "0df79afe-76b9-417f-a1b3-d51c7abffb6f",
            new CreateRoleRequest
            {
                Name = "Tenant 1",
                Type = RecipientType.Signer,
                FullName = "Jane Renter",
                Sequence = 1,
                Order = 1,
            },
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Post, request.Method);
        Assert.Equal("/v2/roles/0df79afe-76b9-417f-a1b3-d51c7abffb6f", request.Uri!.PathAndQuery);

        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        Assert.Equal("Tenant 1", (string?)body["name"]);
        Assert.Equal("signer", (string?)body["type"]);
        Assert.Equal("Jane Renter", (string?)body["full_name"]);
        Assert.Equal(1, (int?)body["sequence"]);
        Assert.Equal(1, (int?)body["order"]);
        Assert.False(body.ContainsKey("email"));
        Assert.False(body.ContainsKey("delegator"));
        Assert.False(body.ContainsKey("name_locked"));
        Assert.False(body.ContainsKey("template_id"));

        Assert.Equal("Tenant 1", role.Name);
        Assert.Equal("signer", role.Type);
    }

    [Fact]
    public async Task UpdateAsync_EncodesRoleNameIntoPath()
    {
        var (roles, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, RoleJson);

        await roles.UpdateAsync(
            "0df79afe-76b9-417f-a1b3-d51c7abffb6f",
            "Tenant 1",
            new UpdateRoleRequest { Email = "renter@example.com" },
            TestContext.Current.CancellationToken);

        // Role names may contain spaces and ride in the path, so they must be URL-encoded.
        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Patch, request.Method);
        Assert.Equal("/v2/roles/0df79afe-76b9-417f-a1b3-d51c7abffb6f/Tenant%201", request.Uri!.PathAndQuery);

        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        Assert.Equal("renter@example.com", (string?)body["email"]);
        Assert.False(body.ContainsKey("name"));
        Assert.False(body.ContainsKey("sequence"));
    }

    [Fact]
    public async Task DeleteAsync_EncodesRoleNameIntoPath()
    {
        var (roles, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, "Deleted");

        await roles.DeleteAsync("0df79afe-76b9-417f-a1b3-d51c7abffb6f", "Tenant 1", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Delete, request.Method);
        Assert.Equal("/v2/roles/0df79afe-76b9-417f-a1b3-d51c7abffb6f/Tenant%201", request.Uri!.PathAndQuery);
    }
}
