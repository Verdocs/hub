using System.Net;
using System.Text.Json.Nodes;
using Verdocs.Models;
using Xunit;

namespace Verdocs.Sdk.Tests;

/// <summary>Request shapes and response handling for the Contacts resource.</summary>
public sealed class ContactsTests
{
    private const string TestBaseUrl = "https://api.test";

    private const string ContactJson = """
        {
          "id": "prof-c1",
          "organization_id": "org-1",
          "first_name": "Carla",
          "last_name": "Contact",
          "email": "carla@customer.com",
          "phone": "+15550100",
          "current": false,
          "permissions": [],
          "roles": ["contact"],
          "created_at": "2026-01-01T00:00:00Z",
          "updated_at": "2026-01-01T00:00:00Z"
        }
        """;

    private static (Verdocs.Resources.Contacts Contacts, FakeHttpMessageHandler Handler) CreateResource()
    {
        var handler = new FakeHttpMessageHandler();
        var client = new HttpClient(handler);
        var endpoint = new VerdocsEndpoint(new VerdocsEndpointOptions { BaseUrl = TestBaseUrl }, client);
        return (new Verdocs.Resources.Contacts(endpoint), handler);
    }

    [Fact]
    public async Task ListAsync_RequestsContactsPath_ParsesProfiles()
    {
        var (contacts, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, "[" + ContactJson + "]");

        var list = await contacts.ListAsync(TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Get, request.Method);
        Assert.Equal("/v2/organization-contacts", request.Uri!.PathAndQuery);
        var contact = Assert.Single(list);
        Assert.Equal("contact", Assert.Single(contact.Roles));
    }

    [Fact]
    public async Task CreateAsync_OmitsUnsetPhone_ParsesProfile()
    {
        var (contacts, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, ContactJson);

        var contact = await contacts.CreateAsync(
            new CreateContactRequest { FirstName = "Carla", LastName = "Contact", Email = "carla@customer.com" },
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Post, request.Method);
        Assert.Equal("/v2/organization-contacts", request.Uri!.PathAndQuery);
        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        Assert.Equal(3, body.Count);
        Assert.Equal("Carla", (string?)body["first_name"]);
        Assert.Equal("carla@customer.com", (string?)body["email"]);
        Assert.False(body.ContainsKey("phone"));
        Assert.Equal("prof-c1", contact.Id);
    }

    [Fact]
    public void CreateAsync_NullRequest_ThrowsSynchronously()
    {
        var (contacts, _) = CreateResource();

        Assert.Throws<ArgumentNullException>(
            () => { _ = contacts.CreateAsync(null!, TestContext.Current.CancellationToken); });
    }

    [Fact]
    public async Task UpdateAsync_PatchesFullContact()
    {
        var (contacts, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, ContactJson);

        await contacts.UpdateAsync(
            "prof-c1",
            new UpdateContactRequest
            {
                FirstName = "Carla",
                LastName = "Contact",
                Email = "carla@customer.com",
                Phone = "+15550100",
            },
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Patch, request.Method);
        Assert.Equal("/v2/organization-contacts/prof-c1", request.Uri!.PathAndQuery);
        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        Assert.Equal(4, body.Count);
        Assert.Equal("+15550100", (string?)body["phone"]);
    }

    [Fact]
    public async Task DeleteAsync_SendsDeleteToContactPath()
    {
        var (contacts, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, """{"status": "OK"}""");

        await contacts.DeleteAsync("prof-c1", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Delete, request.Method);
        Assert.Equal("/v2/organization-contacts/prof-c1", request.Uri!.PathAndQuery);
    }
}
