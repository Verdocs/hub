using System.Net;
using System.Text.Json.Nodes;
using Verdocs.Models;
using Xunit;

namespace Verdocs.Sdk.Tests;

/// <summary>Request shapes and response handling for the Members resource.</summary>
public sealed class MembersTests
{
    private const string TestBaseUrl = "https://api.test";

    private const string ProfileJson = """
        {
          "id": "prof-1",
          "user_id": "user-1",
          "organization_id": "org-1",
          "first_name": "Alice",
          "last_name": "Adams",
          "email": "alice@acme.com",
          "current": false,
          "permissions": [],
          "roles": ["member"],
          "created_at": "2026-01-01T00:00:00Z",
          "updated_at": "2026-01-01T00:00:00Z"
        }
        """;

    private static (Verdocs.Resources.Members Members, FakeHttpMessageHandler Handler) CreateResource()
    {
        var handler = new FakeHttpMessageHandler();
        var client = new HttpClient(handler);
        var endpoint = new VerdocsEndpoint(new VerdocsEndpointOptions { BaseUrl = TestBaseUrl }, client);
        return (new Verdocs.Resources.Members(endpoint), handler);
    }

    [Fact]
    public async Task ListAsync_RequestsMembersPath_ParsesProfiles()
    {
        var (members, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, "[" + ProfileJson + "]");

        var profiles = await members.ListAsync(TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Get, request.Method);
        Assert.Equal("/v2/organization-members", request.Uri!.PathAndQuery);
        var profile = Assert.Single(profiles);
        Assert.Equal("alice@acme.com", profile.Email);
        Assert.Equal("member", Assert.Single(profile.Roles));
    }

    [Fact]
    public async Task CreateAsync_PostsSnakeCaseBody_ParsesWrapper()
    {
        var (members, handler) = CreateResource();
        // The API wraps the profile with the backing user account and, when it generated
        // one, the initial password. The js-sdk types this as the bare profile; the wrapper
        // is the deployed shape.
        handler.Enqueue(HttpStatusCode.OK,
            "{\"profile\": " + ProfileJson
            + ", \"user\": {\"email\": \"alice@acme.com\", \"existed\": false}"
            + ", \"password\": \"generated-pw-1\"}");

        var created = await members.CreateAsync(
            new CreateMemberRequest
            {
                Email = "alice@acme.com",
                FirstName = "Alice",
                LastName = "Adams",
                Roles = ["member"],
            },
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Post, request.Method);
        Assert.Equal("/v2/organization-members", request.Uri!.PathAndQuery);
        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        Assert.Equal("alice@acme.com", (string?)body["email"]);
        Assert.Equal("Alice", (string?)body["first_name"]);
        Assert.Equal("Adams", (string?)body["last_name"]);
        Assert.Equal("member", (string?)body["roles"]![0]);
        Assert.False(body.ContainsKey("password"));

        Assert.Equal("prof-1", created.Profile.Id);
        Assert.False(created.User.Existed);
        Assert.Equal("generated-pw-1", created.Password);
    }

    [Fact]
    public void CreateAsync_NullRequest_ThrowsSynchronously()
    {
        var (members, _) = CreateResource();

        Assert.Throws<ArgumentNullException>(
            () => { _ = members.CreateAsync(null!, TestContext.Current.CancellationToken); });
    }

    [Fact]
    public async Task UpdateAsync_SendsRolesOnly()
    {
        var (members, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, ProfileJson);

        await members.UpdateAsync(
            "prof-1",
            new UpdateMemberRequest { Roles = ["admin"] },
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Patch, request.Method);
        Assert.Equal("/v2/organization-members/prof-1", request.Uri!.PathAndQuery);

        // The deployed schema is strict and accepts roles alone; anything else is a 400.
        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        var property = Assert.Single(body);
        Assert.Equal("roles", property.Key);
    }

    [Fact]
    public async Task DeleteAsync_SendsDeleteToMemberPath()
    {
        var (members, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, """{"status": "OK"}""");

        await members.DeleteAsync("prof-1", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Delete, request.Method);
        Assert.Equal("/v2/organization-members/prof-1", request.Uri!.PathAndQuery);
        Assert.Null(request.Body);
    }

    [Fact]
    public async Task LockAsync_PutsLockActionWithReason()
    {
        var (members, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, """
            {
              "id": "prof-1",
              "user_id": "user-1",
              "organization_id": "org-1",
              "first_name": "Alice",
              "last_name": "Adams",
              "email": "alice@acme.com",
              "current": false,
              "permissions": [],
              "roles": ["member"],
              "created_at": "2026-01-01T00:00:00Z",
              "updated_at": "2026-01-01T00:00:00Z",
              "user": {"id": "user-1", "email": "alice@acme.com", "email_verified": true,
                       "locked": true, "lock_reason": "Departed employee",
                       "created_at": "2026-01-01T00:00:00Z", "updated_at": "2026-01-01T00:00:00Z"}
            }
            """);

        var profile = await members.LockAsync("prof-1", "Departed employee", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Put, request.Method);
        Assert.Equal("/v2/organization-members/prof-1", request.Uri!.PathAndQuery);
        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        Assert.Equal("lock", (string?)body["action"]);
        Assert.Equal("Departed employee", (string?)body["reason"]);

        Assert.True(profile.User?.Locked);
        Assert.Equal("Departed employee", profile.User?.LockReason);
    }

    [Fact]
    public void LockAsync_EmptyReason_ThrowsSynchronously()
    {
        var (members, _) = CreateResource();

        Assert.Throws<ArgumentException>(
            () => { _ = members.LockAsync("prof-1", "", TestContext.Current.CancellationToken); });
    }

    [Fact]
    public async Task UnlockAsync_PutsUnlockActionOnly()
    {
        var (members, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, ProfileJson);

        await members.UnlockAsync("prof-1", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Put, request.Method);
        Assert.Equal("/v2/organization-members/prof-1", request.Uri!.PathAndQuery);
        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        var property = Assert.Single(body);
        Assert.Equal("action", property.Key);
        Assert.Equal("unlock", (string?)property.Value);
    }
}
