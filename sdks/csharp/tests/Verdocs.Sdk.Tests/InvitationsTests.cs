using System.Net;
using System.Text.Json.Nodes;
using Verdocs.Models;
using Xunit;

namespace Verdocs.Sdk.Tests;

/// <summary>Request shapes and response handling for the Invitations resource.</summary>
public sealed class InvitationsTests
{
    private const string TestBaseUrl = "https://api.test";

    private const string InvitationJson = """
        {
          "organization_id": "org-1",
          "email": "new.member@acme.com",
          "first_name": "New",
          "last_name": "Member",
          "status": "pending",
          "role": "member",
          "generated_at": "2026-07-01T00:00:00Z",
          "token": "tok-123"
        }
        """;

    private static (Verdocs.Resources.Invitations Invitations, FakeHttpMessageHandler Handler) CreateResource()
    {
        var handler = new FakeHttpMessageHandler();
        var client = new HttpClient(handler);
        var endpoint = new VerdocsEndpoint(new VerdocsEndpointOptions { BaseUrl = TestBaseUrl }, client);
        return (new Verdocs.Resources.Invitations(endpoint), handler);
    }

    [Fact]
    public async Task ListAsync_RequestsInvitationsPath_ParsesInvitations()
    {
        var (invitations, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, "[" + InvitationJson + "]");

        var list = await invitations.ListAsync(TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Get, request.Method);
        Assert.Equal("/v2/organization-invitations", request.Uri!.PathAndQuery);
        var invitation = Assert.Single(list);
        Assert.Equal("new.member@acme.com", invitation.Email);
        Assert.Equal("pending", invitation.Status);
    }

    [Fact]
    public async Task CreateAsync_PostsInvitation_ParsesResult()
    {
        var (invitations, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, InvitationJson);

        var invitation = await invitations.CreateAsync(
            new CreateInvitationRequest
            {
                Email = "new.member@acme.com",
                FirstName = "New",
                LastName = "Member",
                Role = "member",
            },
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Post, request.Method);
        Assert.Equal("/v2/organization-invitations", request.Uri!.PathAndQuery);
        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        Assert.Equal("new.member@acme.com", (string?)body["email"]);
        Assert.Equal("New", (string?)body["first_name"]);
        Assert.Equal("Member", (string?)body["last_name"]);
        Assert.Equal("member", (string?)body["role"]);
        Assert.Equal("tok-123", invitation.Token);
    }

    [Fact]
    public void CreateAsync_NullRequest_ThrowsSynchronously()
    {
        var (invitations, _) = CreateResource();

        Assert.Throws<ArgumentNullException>(
            () => { _ = invitations.CreateAsync(null!, TestContext.Current.CancellationToken); });
    }

    [Fact]
    public async Task DeleteAsync_EscapesEmailInPath()
    {
        var (invitations, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, """{"status": "OK"}""");

        await invitations.DeleteAsync("new+guy@acme.com", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Delete, request.Method);
        // Emails ride in the path, so reserved characters must arrive percent-encoded.
        Assert.Equal("/v2/organization-invitations/new%2Bguy%40acme.com", request.Uri!.PathAndQuery);
    }

    [Fact]
    public async Task UpdateAsync_SendsRoleOnly()
    {
        var (invitations, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, "");

        await invitations.UpdateAsync("new.member@acme.com", "admin", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Patch, request.Method);
        Assert.Equal("/v2/organization-invitations/new.member%40acme.com", request.Uri!.PathAndQuery);

        // The deployed schema is strict and accepts the role alone; the names the js-sdk
        // sends here would draw a 400.
        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        var property = Assert.Single(body);
        Assert.Equal("role", property.Key);
        Assert.Equal("admin", (string?)property.Value);
    }

    [Fact]
    public async Task ResendAsync_PostsEmailBody()
    {
        var (invitations, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, """{"status": "OK"}""");

        await invitations.ResendAsync("new.member@acme.com", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Post, request.Method);
        Assert.Equal("/v2/organization-invitations/resend", request.Uri!.PathAndQuery);
        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        Assert.Equal("new.member@acme.com", (string?)body["email"]);
    }

    [Fact]
    public async Task GetAsync_RequestsEmailTokenPath_ParsesOrganization()
    {
        var (invitations, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK,
            "{" + InvitationJson.Trim()[1..^1]
            + ", \"organization\": {\"id\": \"org-1\", \"name\": \"Acme\", \"deletion_protected\": true,"
            + " \"created_at\": \"2026-01-01T00:00:00Z\", \"updated_at\": \"2026-01-01T00:00:00Z\"}}");

        var invitation = await invitations.GetAsync("new.member@acme.com", "tok-123", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Get, request.Method);
        Assert.Equal("/v2/organization-invitations/new.member%40acme.com/tok-123", request.Uri!.PathAndQuery);
        Assert.Equal("Acme", invitation.Organization?.Name);
    }

    [Fact]
    public async Task AcceptAsync_PostsBody_ParsesTokens()
    {
        var (invitations, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, """
            {
              "access_token": "eyJ.access.fake",
              "id_token": "eyJ.id.fake",
              "refresh_token": "refresh-1",
              "expires_in": 86400,
              "access_token_exp": 1785000000,
              "refresh_token_exp": 1787592000
            }
            """);

        var tokens = await invitations.AcceptAsync(
            new AcceptOrganizationInvitationRequest
            {
                Email = "new.member@acme.com",
                Token = "tok-123",
                FirstName = "New",
                LastName = "Member",
                Password = "hunter22!",
            },
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Post, request.Method);
        Assert.Equal("/v2/organization-invitations/accept", request.Uri!.PathAndQuery);
        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        Assert.Equal("tok-123", (string?)body["token"]);
        Assert.Equal("hunter22!", (string?)body["password"]);
        Assert.Equal("New", (string?)body["first_name"]);
        Assert.Equal("eyJ.access.fake", tokens.AccessToken);
    }

    [Fact]
    public async Task DeclineAsync_PostsEmailAndToken()
    {
        var (invitations, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, """{"status": "OK"}""");

        await invitations.DeclineAsync("new.member@acme.com", "tok-123", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Post, request.Method);
        Assert.Equal("/v2/organization-invitations/decline", request.Uri!.PathAndQuery);
        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        Assert.Equal(2, body.Count);
        Assert.Equal("new.member@acme.com", (string?)body["email"]);
        Assert.Equal("tok-123", (string?)body["token"]);
    }
}
