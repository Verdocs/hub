using System.Net;
using System.Text.Json;
using Xunit;

namespace Verdocs.Sdk.Tests;

/// <summary>Mapping of API failures, parse failures, timeouts, and cancellation.</summary>
public sealed class ErrorHandlingTests
{
    private const string TestBaseUrl = "https://api.test";

    private static (VerdocsEndpoint Endpoint, FakeHttpMessageHandler Handler) CreateEndpoint(TimeSpan? timeout = null)
    {
        var handler = new FakeHttpMessageHandler();
        var client = new HttpClient(handler);
        var endpoint = new VerdocsEndpoint(new VerdocsEndpointOptions { BaseUrl = TestBaseUrl, Timeout = timeout }, client);
        return (endpoint, handler);
    }

    [Fact]
    public async Task ErrorResponse_ThrowsVerdocsApiException_WithStatusAndBody()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.BadRequest, """{"error":"invalid_grant"}""");

        var exception = await Assert.ThrowsAsync<VerdocsApiException>(
            () => endpoint.GetMyUserAsync(TestContext.Current.CancellationToken));

        Assert.Equal(HttpStatusCode.BadRequest, exception.StatusCode);
        Assert.Equal("""{"error":"invalid_grant"}""", exception.ResponseBody);
    }

    [Fact]
    public async Task ErrorResponse_IsCatchableAsVerdocsException()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.InternalServerError, """{"error":"boom"}""");

        var exception = await Assert.ThrowsAnyAsync<VerdocsException>(
            () => endpoint.GetMyUserAsync(TestContext.Current.CancellationToken));

        Assert.IsType<VerdocsApiException>(exception);
    }

    [Fact]
    public async Task MalformedSuccessBody_ThrowsVerdocsApiException_WithInnerJsonException()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.OK, "this is not json");

        var exception = await Assert.ThrowsAsync<VerdocsApiException>(
            () => endpoint.GetMyUserAsync(TestContext.Current.CancellationToken));

        Assert.Equal(HttpStatusCode.OK, exception.StatusCode);
        Assert.Equal("this is not json", exception.ResponseBody);
        Assert.IsAssignableFrom<JsonException>(exception.InnerException);
    }

    [Fact]
    public async Task NullSuccessBody_ThrowsVerdocsApiException()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.OK, "null");

        var exception = await Assert.ThrowsAsync<VerdocsApiException>(
            () => endpoint.GetMyUserAsync(TestContext.Current.CancellationToken));

        Assert.Equal(HttpStatusCode.OK, exception.StatusCode);
    }

    [Fact]
    public async Task SlowResponse_ThrowsTimeoutException()
    {
        var (endpoint, handler) = CreateEndpoint(TimeSpan.FromMilliseconds(50));
        handler.Enqueue(async (_, cancellationToken) =>
        {
            await Task.Delay(TimeSpan.FromSeconds(30), cancellationToken);
            return new HttpResponseMessage(HttpStatusCode.OK);
        });

        await Assert.ThrowsAsync<TimeoutException>(
            () => endpoint.GetMyUserAsync(TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task CallerCancellation_ThrowsOperationCanceledException_NotTimeout()
    {
        var (endpoint, _) = CreateEndpoint();
        using var cancellation = new CancellationTokenSource();
        await cancellation.CancelAsync();

        await Assert.ThrowsAnyAsync<OperationCanceledException>(
            () => endpoint.GetMyUserAsync(cancellation.Token));
    }
}
