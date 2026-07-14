using System.Net;
using System.Text.Json;
using Xunit;

namespace Verdocs.Sdk.Tests;

/// <summary>Request shapes and response handling for the Users resource.</summary>
public sealed class UsersResourceTests
{
    private const string TestBaseUrl = "https://api.test";

    // Shaped like the deployed notification store rows, which is exactly why
    // GetNotificationsAsync returns raw JSON: these field names (recipient, delivered) do
    // not match the js-sdk's published INotification shape. Payloads live in this file on
    // purpose; SamplePayloads.cs belongs to another slice.
    private const string NotificationsPayload = """
        [
          {
            "id": "6d2f1a9b-1111-4222-8333-444455556666",
            "type": "app",
            "recipient": "profile-1234",
            "event_name": "envelope_completed",
            "envelope_id": "envelope-1234",
            "role_name": "Recipient 1",
            "data": {"envelope_name": "Lease Agreement"},
            "delivered": false
          },
          {
            "id": "6d2f1a9b-7777-4888-8999-000011112222",
            "type": "app",
            "recipient": "profile-1234",
            "event_name": "envelope_declined",
            "data": null,
            "delivered": true
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
    public async Task GetNotificationsAsync_RequestsNotificationsAndReturnsRawRows()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.OK, NotificationsPayload);

        var notifications = await endpoint.Users.GetNotificationsAsync(TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Get, request.Method);
        Assert.Equal("/v2/notifications", request.Uri!.PathAndQuery);
        Assert.Null(request.Body);

        Assert.Equal(JsonValueKind.Array, notifications.ValueKind);
        Assert.Equal(2, notifications.GetArrayLength());

        var first = notifications[0];
        Assert.Equal("envelope_completed", first.GetProperty("event_name").GetString());
        Assert.Equal("profile-1234", first.GetProperty("recipient").GetString());
        Assert.False(first.GetProperty("delivered").GetBoolean());
        Assert.Equal("Lease Agreement", first.GetProperty("data").GetProperty("envelope_name").GetString());
    }
}
