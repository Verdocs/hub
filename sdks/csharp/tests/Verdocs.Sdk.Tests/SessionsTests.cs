using System.Net;
using System.Text.Json;
using Verdocs.Models;
using Xunit;

namespace Verdocs.Sdk.Tests;

/// <summary>Request shapes and response handling for the Sessions resource.</summary>
public sealed class SessionsTests
{
    private const string TestBaseUrl = "https://api.test";

    private const string SessionsPayload = """
        [
          {
            "id": "sess-current",
            "current": true,
            "source": "google",
            "created_at": "2026-09-10T12:00:00.000Z",
            "last_seen_at": "2026-09-18T08:30:00.000Z",
            "browser": "Chrome",
            "platform": "macOS",
            "mobile": false,
            "location": "Portland, OR, US",
            "ip_address": "73.***.***.14"
          },
          {
            "id": "sess-phone",
            "current": false,
            "source": "oauth2:client-1",
            "created_at": "2026-09-01T12:00:00.000Z",
            "last_seen_at": "2026-09-02T12:00:00.000Z",
            "browser": null,
            "platform": null,
            "mobile": true,
            "location": null,
            "ip_address": null
          }
        ]
        """;

    private static (VerdocsEndpoint Endpoint, FakeHttpMessageHandler Handler) CreateEndpoint()
    {
        var handler = new FakeHttpMessageHandler();
        var client = new HttpClient(handler);
        var endpoint = new VerdocsEndpoint(new VerdocsEndpointOptions { BaseUrl = TestBaseUrl }, client);
        return (endpoint, handler);
    }

    [Fact]
    public async Task GetSessionsAsync_RequestsSessionsPath_ParsesSessions()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.OK, SessionsPayload);

        var sessions = await endpoint.Sessions.GetSessionsAsync(TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Get, request.Method);
        Assert.Equal("/v2/users/sessions", request.Uri!.PathAndQuery);
        Assert.Null(request.Body);

        Assert.Equal(2, sessions.Count);
        var current = sessions[0];
        Assert.Equal("sess-current", current.Id);
        Assert.True(current.Current);
        Assert.Equal(SignInProvider.Google, current.Source);
        Assert.Equal(new DateTimeOffset(2026, 9, 10, 12, 0, 0, TimeSpan.Zero), current.CreatedAt);
        Assert.Equal(new DateTimeOffset(2026, 9, 18, 8, 30, 0, TimeSpan.Zero), current.LastSeenAt);
        Assert.Equal("Chrome", current.Browser);
        Assert.Equal("macOS", current.Platform);
        Assert.False(current.Mobile);
        Assert.Equal("Portland, OR, US", current.Location);
        Assert.Equal("73.***.***.14", current.IpAddress);

        var phone = sessions[1];
        Assert.False(phone.Current);
        Assert.Equal("oauth2:client-1", phone.Source);
        Assert.True(phone.Mobile);
        Assert.Null(phone.Browser);
        Assert.Null(phone.IpAddress);
    }

    [Fact]
    public void RoundTrip_UserLoginSession_PreservesPayload()
    {
        var sessions = JsonSerializer.Deserialize<List<UserLoginSession>>(SessionsPayload, VerdocsJson.Options);

        Assert.NotNull(sessions);
        Assert.Equal(VolatileJson.NormalizeText(SessionsPayload), VolatileJson.NormalizeValue(sessions));
    }

    [Fact]
    public async Task RevokeSessionAsync_SendsDeleteToSessionPath()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.OK, """{"status": "OK"}""");

        await endpoint.Sessions.RevokeSessionAsync("sess phone", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Delete, request.Method);
        Assert.Equal("/v2/users/sessions/sess%20phone", request.Uri!.PathAndQuery);
        Assert.Null(request.Body);
    }

    [Fact]
    public void RevokeSessionAsync_EmptyId_ThrowsSynchronously()
    {
        var (endpoint, _) = CreateEndpoint();

        Assert.Throws<ArgumentException>(
            () => { _ = endpoint.Sessions.RevokeSessionAsync("", TestContext.Current.CancellationToken); });
    }

    [Fact]
    public async Task RevokeOtherSessionsAsync_SendsDeleteToSessionsPath_ParsesCount()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.OK, """{"revoked": 3}""");

        var result = await endpoint.Sessions.RevokeOtherSessionsAsync(TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Delete, request.Method);
        Assert.Equal("/v2/users/sessions", request.Uri!.PathAndQuery);
        Assert.Null(request.Body);

        Assert.Equal(3, result.Revoked);
    }
}
