using System.Net;
using System.Text;

namespace Verdocs.Sdk.Tests;

/// <summary>
/// The HTTP test seam: unit tests never touch the network. Hand an HttpClient over this
/// handler to a VerdocsEndpoint, queue canned responses, and assert on the captured requests.
/// </summary>
public sealed class FakeHttpMessageHandler : HttpMessageHandler
{
    private readonly Queue<Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>>> _responders = new();

    /// <summary>Every request the handler has seen, in order.</summary>
    public List<CapturedRequest> Requests { get; } = [];

    /// <summary>True once the handler has been disposed, which happens when its HttpClient is disposed.</summary>
    public bool Disposed { get; private set; }

    /// <summary>Queues a JSON response for the next request.</summary>
    public void Enqueue(HttpStatusCode statusCode, string jsonBody)
    {
        _responders.Enqueue((_, _) => Task.FromResult(BuildJsonResponse(statusCode, jsonBody)));
    }

    /// <summary>Queues an arbitrary responder, for delay and cancellation scenarios.</summary>
    public void Enqueue(Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>> responder)
    {
        _responders.Enqueue(responder);
    }

    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        // The real transport rejects an already-canceled token before doing any work; the
        // fake has to do the same for cancellation tests to mean anything.
        cancellationToken.ThrowIfCancellationRequested();

        // The request and its content are disposed once the call completes, so everything an
        // assertion might need is copied out here.
        string? body = request.Content is null
            ? null
            : await request.Content.ReadAsStringAsync(cancellationToken);

        var headers = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var header in request.Headers)
        {
            headers[header.Key] = string.Join(",", header.Value);
        }

        Requests.Add(new CapturedRequest(request.Method, request.RequestUri, headers, body));

        if (_responders.Count == 0)
        {
            return BuildJsonResponse(HttpStatusCode.OK, "{}");
        }

        return await _responders.Dequeue()(request, cancellationToken);
    }

    protected override void Dispose(bool disposing)
    {
        Disposed = true;
        base.Dispose(disposing);
    }

    private static HttpResponseMessage BuildJsonResponse(HttpStatusCode statusCode, string jsonBody)
    {
        return new HttpResponseMessage(statusCode)
        {
            Content = new StringContent(jsonBody, Encoding.UTF8, "application/json"),
        };
    }
}
