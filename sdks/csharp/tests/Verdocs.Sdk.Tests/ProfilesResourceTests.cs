using System.Net;
using System.Text.Json.Nodes;
using Verdocs.Models;
using Xunit;

namespace Verdocs.Sdk.Tests;

/// <summary>Request shapes and response handling for the Profiles resource.</summary>
public sealed class ProfilesResourceTests
{
    private const string TestBaseUrl = "https://api.test";

    // Payloads live in this file on purpose; SamplePayloads.cs belongs to another slice.
    private const string ProfilePayload = """
        {
          "id": "profile-1234",
          "user_id": "user-1234",
          "organization_id": "org-1234",
          "first_name": "Test",
          "last_name": "User",
          "email": "test@example.com",
          "phone": null,
          "picture": null,
          "current": true,
          "permissions": ["envelope:create"],
          "roles": ["owner"],
          "locale": "en-US",
          "timezone": "America/New_York",
          "created_at": "2026-01-05T12:00:00Z",
          "updated_at": "2026-01-05T12:00:00Z"
        }
        """;

    private const string AuthPayload = """
        {
          "access_token": "access-1",
          "id_token": "id-1",
          "refresh_token": "refresh-1",
          "expires_in": 86400,
          "access_token_exp": 1767171600,
          "refresh_token_exp": 1769763600
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
    public async Task ListAsync_RequestsProfilesAndParsesAll()
    {
        var (endpoint, handler) = CreateEndpoint();
        var other = ProfilePayload
            .Replace("\"current\": true", "\"current\": false")
            .Replace("profile-1234", "profile-5678");
        handler.Enqueue(HttpStatusCode.OK, "[" + ProfilePayload + "," + other + "]");

        var profiles = await endpoint.Profiles.ListAsync(TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Get, request.Method);
        Assert.Equal("/v2/profiles", request.Uri!.PathAndQuery);

        Assert.Equal(2, profiles.Count);
        Assert.True(profiles[0].Current);
        Assert.Equal("profile-5678", profiles[1].Id);
        Assert.Equal("owner", Assert.Single(profiles[1].Roles));
    }

    [Fact]
    public async Task CreateAsync_PostsSnakeCaseBodyAndOmitsUnsetOptionals()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.OK, AuthPayload);

        var response = await endpoint.Profiles.CreateAsync(
            new CreateProfileRequest
            {
                Email = "test@example.com",
                Password = "hunter22",
                FirstName = "Test",
                LastName = "User",
                OrgName = "New Org",
                Phone = "+15551234567",
            },
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Post, request.Method);
        Assert.Equal("/v2/profiles", request.Uri!.PathAndQuery);

        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        Assert.Equal("test@example.com", (string?)body["email"]);
        Assert.Equal("hunter22", (string?)body["password"]);
        Assert.Equal("Test", (string?)body["first_name"]);
        Assert.Equal("User", (string?)body["last_name"]);
        Assert.Equal("New Org", (string?)body["org_name"]);
        Assert.Equal("+15551234567", (string?)body["phone"]);
        // The deployed CreateProfileSchema is strict, so unset optionals must stay off the wire.
        Assert.False(body.ContainsKey("timezone"));
        Assert.False(body.ContainsKey("locale"));

        Assert.Equal("access-1", response.AccessToken);
    }

    [Fact]
    public void CreateAsync_NullRequest_ThrowsSynchronously()
    {
        var (endpoint, _) = CreateEndpoint();

        Assert.Throws<ArgumentNullException>(
            () => { _ = endpoint.Profiles.CreateAsync(null!, TestContext.Current.CancellationToken); });
    }

    [Fact]
    public async Task SwitchAsync_PostsToSwitchPathWithoutBody()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.OK, AuthPayload);

        var response = await endpoint.Profiles.SwitchAsync("profile-5678", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Post, request.Method);
        Assert.Equal("/v2/profiles/profile-5678/switch", request.Uri!.PathAndQuery);
        Assert.Null(request.Body);

        // The endpoint does not auto-apply the new tokens; the caller passes this to SetToken.
        Assert.Equal("access-1", response.AccessToken);
    }

    [Fact]
    public void SwitchAsync_EmptyId_ThrowsSynchronously()
    {
        var (endpoint, _) = CreateEndpoint();

        Assert.Throws<ArgumentException>(
            () => { _ = endpoint.Profiles.SwitchAsync("", TestContext.Current.CancellationToken); });
    }

    [Fact]
    public async Task UpdateAsync_PatchesOnlySetFields()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.OK, ProfilePayload);

        var profile = await endpoint.Profiles.UpdateAsync(
            "profile-1234",
            new UpdateProfileRequest
            {
                FirstName = "New",
                Timezone = "America/Chicago",
                Roles = ["admin"],
            },
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Patch, request.Method);
        Assert.Equal("/v2/profiles/profile-1234", request.Uri!.PathAndQuery);

        // The deployed schemas are strict per path, so unset fields must stay off the wire.
        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        Assert.Equal("New", (string?)body["first_name"]);
        Assert.Equal("America/Chicago", (string?)body["timezone"]);
        var roles = Assert.IsType<JsonArray>(body["roles"]);
        Assert.Equal("admin", (string?)Assert.Single(roles));
        Assert.Equal(3, body.Count);

        Assert.Equal("profile-1234", profile.Id);
    }

    [Fact]
    public void UpdateAsync_NullRequest_ThrowsSynchronously()
    {
        var (endpoint, _) = CreateEndpoint();

        Assert.Throws<ArgumentNullException>(
            () => { _ = endpoint.Profiles.UpdateAsync("profile-1234", null!, TestContext.Current.CancellationToken); });
    }

    [Fact]
    public async Task DeleteAsync_NextProfileAvailable_ReturnsTokens()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.OK, AuthPayload);

        var result = await endpoint.Profiles.DeleteAsync("profile-1234", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Delete, request.Method);
        Assert.Equal("/v2/profiles/profile-1234", request.Uri!.PathAndQuery);

        Assert.Equal("access-1", result.AccessToken);
        Assert.Equal(86400, result.ExpiresIn);
        Assert.Null(result.Status);
        Assert.Null(result.Message);
    }

    [Fact]
    public async Task DeleteAsync_LastProfile_ReturnsLogoutNotice()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(
            HttpStatusCode.OK,
            """{"status": "OK", "message": "Your last profile has been deleted. You are now logged out."}""");

        var result = await endpoint.Profiles.DeleteAsync("profile-1234", TestContext.Current.CancellationToken);

        Assert.Equal(RequestStatus.Ok, result.Status);
        Assert.Equal("Your last profile has been deleted. You are now logged out.", result.Message);
        Assert.Null(result.AccessToken);
        Assert.Null(result.RefreshToken);
    }

    [Fact]
    public async Task UpdatePhotoAsync_SendsMultipartPicturePart()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.OK, ProfilePayload);

        using var photo = new MemoryStream("fake-png-bytes"u8.ToArray());
        var profile = await endpoint.Profiles.UpdatePhotoAsync(
            "profile-1234",
            photo,
            "avatar.png",
            "image/png",
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Patch, request.Method);
        Assert.Equal("/v2/profiles/profile-1234", request.Uri!.PathAndQuery);

        // The multipart body serializes its per-part headers inline, so the part name, the
        // filename, and the declared content type are all assertable from the captured body.
        Assert.NotNull(request.Body);
        Assert.Matches("name=\"?picture\"?", request.Body);
        Assert.Matches("filename=\"?avatar\\.png\"?", request.Body);
        Assert.Contains("Content-Type: image/png", request.Body);
        Assert.Contains("fake-png-bytes", request.Body);

        Assert.Equal("profile-1234", profile.Id);
    }

    [Fact]
    public void UpdatePhotoAsync_InvalidContentType_ThrowsSynchronously()
    {
        var (endpoint, _) = CreateEndpoint();
        using var photo = new MemoryStream([1, 2, 3]);

        Assert.Throws<ArgumentException>(
            () => { _ = endpoint.Profiles.UpdatePhotoAsync("profile-1234", photo, "avatar.png", "not a mime type", TestContext.Current.CancellationToken); });
    }
}
