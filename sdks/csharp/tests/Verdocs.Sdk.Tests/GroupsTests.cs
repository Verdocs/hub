using System.Net;
using System.Text.Json.Nodes;
using Verdocs.Models;
using Xunit;

namespace Verdocs.Sdk.Tests;

/// <summary>Request shapes and response handling for the Groups resource.</summary>
public sealed class GroupsTests
{
    private const string TestBaseUrl = "https://api.test";

    private const string GroupJson = """
        {
          "id": "grp-1",
          "name": "managers",
          "organization_id": "org-1",
          "permissions": ["template:creation", "template:visibility"]
        }
        """;

    private static (Verdocs.Resources.Groups Groups, FakeHttpMessageHandler Handler) CreateResource()
    {
        var handler = new FakeHttpMessageHandler();
        var client = new HttpClient(handler);
        var endpoint = new VerdocsEndpoint(new VerdocsEndpointOptions { BaseUrl = TestBaseUrl }, client);
        return (new Verdocs.Resources.Groups(endpoint), handler);
    }

    [Fact]
    public async Task ListAsync_RequestsGroupsPath_ParsesGroups()
    {
        var (groups, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, "[" + GroupJson + "]");

        var list = await groups.ListAsync(TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Get, request.Method);
        Assert.Equal("/v2/organization-groups", request.Uri!.PathAndQuery);
        var group = Assert.Single(list);
        Assert.Equal("managers", group.Name);
        Assert.Equal(2, group.Permissions.Count);
    }

    [Fact]
    public async Task GetAsync_ParsesGroupWithMemberships()
    {
        var (groups, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, """
            {
              "id": "grp-1",
              "name": "managers",
              "organization_id": "org-1",
              "permissions": ["template:creation"],
              "profiles": [{"group_id": "grp-1", "profile_id": "prof-1", "organization_id": "org-1"}]
            }
            """);

        var group = await groups.GetAsync("grp-1", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal("/v2/organization-groups/grp-1", request.Uri!.PathAndQuery);
        var membership = Assert.Single(group.Profiles!);
        Assert.Equal("prof-1", membership.ProfileId);
    }

    [Fact]
    public async Task CreateAsync_PostsNameAndPermissions()
    {
        var (groups, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, GroupJson);

        var group = await groups.CreateAsync(
            new CreateGroupRequest { Name = "managers", Permissions = ["template:creation", "template:visibility"] },
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Post, request.Method);
        Assert.Equal("/v2/organization-groups", request.Uri!.PathAndQuery);
        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        Assert.Equal("managers", (string?)body["name"]);
        Assert.Equal(2, body["permissions"]!.AsArray().Count);
        Assert.Equal("grp-1", group.Id);
    }

    [Fact]
    public void CreateAsync_NullRequest_ThrowsSynchronously()
    {
        var (groups, _) = CreateResource();

        Assert.Throws<ArgumentNullException>(
            () => { _ = groups.CreateAsync(null!, TestContext.Current.CancellationToken); });
    }

    [Fact]
    public async Task UpdateAsync_PatchesNameAndPermissions()
    {
        var (groups, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, GroupJson);

        await groups.UpdateAsync(
            "grp-1",
            new UpdateGroupRequest { Name = "managers", Permissions = ["template:creation"] },
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Patch, request.Method);
        Assert.Equal("/v2/organization-groups/grp-1", request.Uri!.PathAndQuery);
        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        Assert.Equal(2, body.Count);
        Assert.Equal("managers", (string?)body["name"]);
    }

    [Fact]
    public async Task DeleteAsync_SendsDeleteToGroupPath()
    {
        var (groups, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, """{"status": "OK"}""");

        await groups.DeleteAsync("grp-1", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Delete, request.Method);
        Assert.Equal("/v2/organization-groups/grp-1", request.Uri!.PathAndQuery);
    }

    [Fact]
    public async Task AddMemberAsync_PostsProfileId_ToleratesEmptyBody()
    {
        var (groups, handler) = CreateResource();
        // The deployed handler never creates the membership and answers an empty body; the
        // call must still complete without a parse error.
        handler.Enqueue(HttpStatusCode.OK, "");

        await groups.AddMemberAsync("grp-1", "prof-1", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Post, request.Method);
        Assert.Equal("/v2/organization-groups/grp-1/members", request.Uri!.PathAndQuery);
        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        Assert.Equal("prof-1", (string?)body["profile_id"]);
    }

    [Fact]
    public async Task DeleteMemberAsync_DeletesMembershipPath()
    {
        var (groups, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, """{"status": "OK"}""");

        await groups.DeleteMemberAsync("grp-1", "prof-1", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Delete, request.Method);
        Assert.Equal("/v2/organization-groups/grp-1/members/prof-1", request.Uri!.PathAndQuery);
    }
}
