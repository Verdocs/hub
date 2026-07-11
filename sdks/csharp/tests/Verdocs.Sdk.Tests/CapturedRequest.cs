namespace Verdocs.Sdk.Tests;

/// <summary>A request observed by <see cref="FakeHttpMessageHandler"/>, with its content read eagerly.</summary>
public sealed record CapturedRequest(
    HttpMethod Method,
    Uri? Uri,
    IReadOnlyDictionary<string, string> Headers,
    string? Body);
