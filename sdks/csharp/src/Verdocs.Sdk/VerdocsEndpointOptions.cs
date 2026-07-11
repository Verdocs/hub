namespace Verdocs;

/// <summary>
/// Construction options for <see cref="VerdocsEndpoint"/>. All values are optional; the
/// defaults call the production API as a user session with a 60 second timeout.
/// </summary>
public sealed record VerdocsEndpointOptions
{
    /// <summary>
    /// Base URL for API calls, origin only (for example "https://api.verdocs.com"). This should
    /// rarely be anything else; beta integrations use "https://stage-api.verdocs.com".
    /// </summary>
    public string? BaseUrl { get; init; }

    /// <summary>
    /// Per-request timeout. Defaults to 60 seconds. Some calls involve rendering work on the
    /// server, so very short timeouts are not recommended.
    /// </summary>
    public TimeSpan? Timeout { get; init; }

    /// <summary>Session type this endpoint will carry. Defaults to <see cref="Verdocs.SessionType.User"/>.</summary>
    public SessionType SessionType { get; init; } = SessionType.User;

    /// <summary>Optional client ID, sent as the X-Client-ID header on every request when set.</summary>
    public string? ClientId { get; init; }
}
