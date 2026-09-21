using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Verdocs.Resources;

namespace Verdocs;

/// <summary>
/// A connection and authorization context for calling the Verdocs platform APIs. An endpoint
/// carries exactly one session, either a user session or a signing session; run two endpoint
/// instances when both are needed at once (an authenticated user signing an envelope, for
/// example). Ephemeral signing endpoints can be created, used for the signing calls, and
/// discarded when signing completes. Operations live on the resource properties
/// (<see cref="Auth"/>, <see cref="Users"/>, <see cref="Profiles"/>, <see cref="Templates"/>).
///
/// <example>
/// <code>
/// using var endpoint = new VerdocsEndpoint();
/// var auth = await endpoint.Auth.AuthenticateAsync(new PasswordGrantRequest
/// {
///     Username = "you@example.com",
///     Password = "PASSWORD",
/// });
/// endpoint.SetToken(auth.AccessToken);
///
/// var templates = await endpoint.Templates.ListAsync(new GetTemplatesOptions { Rows = 10 });
/// </code>
/// </example>
/// </summary>
public sealed class VerdocsEndpoint : IDisposable
{
    private const string DefaultBaseUrl = "https://api.verdocs.com";

    // 60 seconds mirrors the JS SDK default; some calls trigger server-side rendering and
    // need the headroom.
    private static readonly TimeSpan DefaultTimeout = TimeSpan.FromSeconds(60);

    private static readonly Lazy<VerdocsEndpoint> LazyDefault = new(() => new VerdocsEndpoint());

    private readonly HttpClient _httpClient;
    private readonly bool _ownsHttpClient;

    /// <summary>
    /// Creates an endpoint for calling Verdocs platform services.
    /// </summary>
    /// <param name="options">Optional configuration; defaults target production as a user session.</param>
    /// <param name="httpClient">
    /// Optional client to send requests with, for IHttpClientFactory users. The endpoint never
    /// mutates or disposes a supplied client; auth and client-id headers are applied per
    /// request. When omitted, the endpoint creates and owns its own client.
    /// </param>
    public VerdocsEndpoint(VerdocsEndpointOptions? options = null, HttpClient? httpClient = null)
    {
        var baseUrl = options?.BaseUrl ?? DefaultBaseUrl;
        if (!Uri.TryCreate(baseUrl, UriKind.Absolute, out var parsedBaseUrl)
            || (parsedBaseUrl.Scheme != Uri.UriSchemeHttp && parsedBaseUrl.Scheme != Uri.UriSchemeHttps))
        {
            throw new ArgumentException("BaseUrl must be an absolute http or https URL.", nameof(options));
        }

        var timeout = options?.Timeout ?? DefaultTimeout;
        if (timeout <= TimeSpan.Zero)
        {
            throw new ArgumentException("Timeout must be greater than zero.", nameof(options));
        }

        BaseUrl = parsedBaseUrl;
        Timeout = timeout;
        ClientId = options?.ClientId;
        SessionType = options?.SessionType ?? SessionType.User;

        if (httpClient is not null)
        {
            _httpClient = httpClient;
            _ownsHttpClient = false;
        }
        else
        {
            // PooledConnectionLifetime keeps long-lived endpoints honest about DNS changes, per
            // the HttpClient guidelines. The client timeout is infinite because the endpoint
            // enforces its own per-request timeout below.
            _httpClient = new HttpClient(
                new SocketsHttpHandler { PooledConnectionLifetime = TimeSpan.FromMinutes(2) },
                disposeHandler: true)
            {
                Timeout = System.Threading.Timeout.InfiniteTimeSpan,
            };
            _ownsHttpClient = true;
        }

        Auth = new Auth(this);
        Users = new Users(this);
        Sessions = new Sessions(this);
        Mfa = new Mfa(this);
        Profiles = new Profiles(this);
        Templates = new Templates(this);
        TemplateDocuments = new TemplateDocuments(this);
        TemplateRoles = new TemplateRoles(this);
        TemplateFields = new TemplateFields(this);
        Envelopes = new Envelopes(this);
        Recipients = new Recipients(this);
        Kba = new Kba(this);
        Signatures = new Signatures(this);
        Initials = new Initials(this);
        Organizations = new Organizations(this);
        Members = new Members(this);
        Groups = new Groups(this);
        Invitations = new Invitations(this);
        Contacts = new Contacts(this);
        ApiKeys = new ApiKeys(this);
        Brands = new Brands(this);
        Webhooks = new Webhooks(this);
        NotificationTemplates = new NotificationTemplates(this);
    }

    /// <summary>
    /// A lazily created process-wide default endpoint, mirroring the JS SDK's getDefault().
    /// Nothing inside the SDK assumes this instance; it exists for apps that want one shared
    /// endpoint without wiring their own. It lives for the process and is never disposed.
    /// </summary>
    public static VerdocsEndpoint Default => LazyDefault.Value;

    /// <summary>The base URL API calls are sent to.</summary>
    public Uri BaseUrl { get; }

    /// <summary>The per-request timeout.</summary>
    public TimeSpan Timeout { get; }

    /// <summary>The client ID sent as X-Client-ID on every request, or null if not set.</summary>
    public string? ClientId { get; }

    /// <summary>The session type this endpoint currently carries.</summary>
    public SessionType SessionType { get; private set; }

    /// <summary>
    /// The current access token, or null if not authenticated. Rarely needed directly, but
    /// some integrations require it to authorize raw file downloads.
    /// </summary>
    public string? Token { get; private set; }

    /// <summary>The decoded session for the current token, or null if not authenticated.</summary>
    public VerdocsSession? Session { get; private set; }

    /// <summary>Authentication calls for this endpoint.</summary>
    public Auth Auth { get; }

    /// <summary>User account calls for this endpoint.</summary>
    public Users Users { get; }

    /// <summary>Login session calls for this endpoint.</summary>
    public Sessions Sessions { get; }

    /// <summary>Multi-factor authentication calls for this endpoint.</summary>
    public Mfa Mfa { get; }

    /// <summary>Profile calls for this endpoint.</summary>
    public Profiles Profiles { get; }

    /// <summary>Template calls for this endpoint.</summary>
    public Templates Templates { get; }

    /// <summary>Template document calls for this endpoint.</summary>
    public TemplateDocuments TemplateDocuments { get; }

    /// <summary>Template role calls for this endpoint.</summary>
    public TemplateRoles TemplateRoles { get; }

    /// <summary>Template field calls for this endpoint.</summary>
    public TemplateFields TemplateFields { get; }

    /// <summary>Envelope calls for this endpoint.</summary>
    public Envelopes Envelopes { get; }

    /// <summary>Envelope recipient calls for this endpoint.</summary>
    public Recipients Recipients { get; }

    /// <summary>Knowledge-based authentication calls for this endpoint. The deployed API has no /v2/kba routes; see the resource docs.</summary>
    public Kba Kba { get; }

    /// <summary>Signature image calls for this endpoint.</summary>
    public Signatures Signatures { get; }

    /// <summary>Initials image calls for this endpoint.</summary>
    public Initials Initials { get; }

    /// <summary>Organization calls for this endpoint.</summary>
    public Organizations Organizations { get; }

    /// <summary>Organization member calls for this endpoint.</summary>
    public Members Members { get; }

    /// <summary>Organization group calls for this endpoint.</summary>
    public Groups Groups { get; }

    /// <summary>Organization invitation calls for this endpoint.</summary>
    public Invitations Invitations { get; }

    /// <summary>Organization contact calls for this endpoint.</summary>
    public Contacts Contacts { get; }

    /// <summary>API key calls for this endpoint.</summary>
    public ApiKeys ApiKeys { get; }

    /// <summary>Brand calls for this endpoint.</summary>
    public Brands Brands { get; }

    /// <summary>Webhook calls for this endpoint.</summary>
    public Webhooks Webhooks { get; }

    /// <summary>Notification template calls for this endpoint.</summary>
    public NotificationTemplates NotificationTemplates { get; }

    /// <summary>
    /// Stores the access token applied to subsequent requests, along with its decoded session
    /// metadata. Passing null, an unparseable token, or an expired token clears the session
    /// instead. Token persistence is the caller's responsibility; unlike the JS SDK there is
    /// no localStorage equivalent here.
    /// </summary>
    /// <param name="token">The access token returned by <see cref="Resources.Auth.AuthenticateAsync"/>, or null to clear.</param>
    /// <param name="sessionType">
    /// Explicit session type override. When omitted, the token's own session_type claim decides,
    /// falling back to the endpoint's current type.
    /// </param>
    /// <returns>The endpoint, for chaining.</returns>
    public VerdocsEndpoint SetToken(string? token, SessionType? sessionType = null)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return ClearSession();
        }

        var claims = TokenParser.TryParse(token);
        if (claims is null)
        {
            return ClearSession();
        }

        var expiresAt = claims.Exp is { } exp ? DateTimeOffset.FromUnixTimeSeconds(exp) : (DateTimeOffset?)null;
        if (expiresAt is { } expiry && expiry <= DateTimeOffset.UtcNow)
        {
            return ClearSession();
        }

        var resolvedType = sessionType ?? claims.SessionType switch
        {
            "user" => SessionType.User,
            "signing" => SessionType.Signing,
            _ => SessionType,
        };

        Token = token;
        SessionType = resolvedType;
        Session = new VerdocsSession
        {
            SessionType = resolvedType,
            Sub = claims.Sub,
            Sid = claims.Sid,
            Email = claims.Email,
            ProfileId = claims.ProfileId,
            OrganizationId = claims.OrganizationId,
            EnvelopeId = claims.EnvelopeId,
            RoleName = claims.RoleName,
            GlobalAdmin = claims.GlobalAdmin,
            IssuedAt = claims.Iat is { } iat ? DateTimeOffset.FromUnixTimeSeconds(iat) : null,
            ExpiresAt = expiresAt,
        };

        return this;
    }

    /// <summary>Clears the active session. Subsequent requests are sent unauthenticated.</summary>
    /// <returns>The endpoint, for chaining.</returns>
    public VerdocsEndpoint ClearSession()
    {
        Token = null;
        Session = null;
        return this;
    }

    /// <summary>Disposes the HTTP client this endpoint created. A caller-supplied client is left alone.</summary>
    public void Dispose()
    {
        if (_ownsHttpClient)
        {
            _httpClient.Dispose();
        }

        GC.SuppressFinalize(this);
    }

    private void ApplyHeaders(HttpRequestMessage request)
    {
        if (ClientId is not null)
        {
            request.Headers.TryAddWithoutValidation("X-Client-ID", ClientId);
        }

        if (Token is null)
        {
            return;
        }

        if (SessionType == SessionType.User)
        {
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", Token);
        }
        else
        {
            // Signing-session calls still route through the legacy rForm service, which reads
            // the token from a separate lowercase "signer" header rather than Authorization.
            // The JS SDK does the same; both switch to Authorization together once rForm is
            // confirmed to tolerate it.
            request.Headers.TryAddWithoutValidation("signer", "Bearer " + Token);
        }
    }

    /// <summary>
    /// Sends one API request with a JSON body (or none) and returns the parsed response.
    /// </summary>
    internal Task<TResponse> SendAsync<TResponse>(HttpMethod method, string pathAndQuery, object? body, CancellationToken cancellationToken)
    {
        return SendAsync<TResponse>(method, pathAndQuery, ToJsonContent(body), cancellationToken);
    }

    /// <summary>
    /// Sends one API request with prebuilt content (multipart uploads, mainly) and returns
    /// the parsed response.
    /// </summary>
    internal async Task<TResponse> SendAsync<TResponse>(HttpMethod method, string pathAndQuery, HttpContent? content, CancellationToken cancellationToken)
    {
        var (statusCode, bytes) = await SendCoreWithStatusAsync(method, pathAndQuery, content, cancellationToken).ConfigureAwait(false);
        var responseBody = Encoding.UTF8.GetString(bytes);

        try
        {
            return JsonSerializer.Deserialize<TResponse>(responseBody, VerdocsJson.Options)
                ?? throw new VerdocsApiException(
                    statusCode,
                    responseBody,
                    "The Verdocs API returned an empty body where a value was required.");
        }
        catch (JsonException exception)
        {
            throw new VerdocsApiException(
                statusCode,
                responseBody,
                "The Verdocs API response could not be parsed.",
                exception);
        }
    }

    /// <summary>
    /// Sends one API request and discards the response body. Several delete endpoints answer
    /// with a bare success string that is not JSON and that nothing consumes.
    /// </summary>
    internal async Task SendVoidAsync(HttpMethod method, string pathAndQuery, object? body, CancellationToken cancellationToken)
    {
        await SendCoreAsync(method, pathAndQuery, ToJsonContent(body), cancellationToken).ConfigureAwait(false);
    }

    /// <summary>
    /// Sends one API request and returns the response body as text. The download-link and
    /// page-image endpoints answer with a bare URL string, not JSON.
    /// </summary>
    internal async Task<string> SendStringAsync(HttpMethod method, string pathAndQuery, CancellationToken cancellationToken)
    {
        var bytes = await SendCoreAsync(method, pathAndQuery, null, cancellationToken).ConfigureAwait(false);
        return Encoding.UTF8.GetString(bytes);
    }

    /// <summary>
    /// Sends one API request and returns the raw response bytes, for file and ZIP downloads.
    /// </summary>
    internal Task<byte[]> SendBytesAsync(HttpMethod method, string pathAndQuery, CancellationToken cancellationToken)
    {
        return SendCoreAsync(method, pathAndQuery, null, cancellationToken);
    }

    private static JsonContent? ToJsonContent(object? body)
    {
        return body is null ? null : JsonContent.Create(body, body.GetType(), mediaType: null, VerdocsJson.Options);
    }

    private async Task<byte[]> SendCoreAsync(HttpMethod method, string pathAndQuery, HttpContent? content, CancellationToken cancellationToken)
    {
        var (_, bytes) = await SendCoreWithStatusAsync(method, pathAndQuery, content, cancellationToken).ConfigureAwait(false);
        return bytes;
    }

    /// <summary>
    /// The one place a request actually goes out: headers, the timeout policy, and error
    /// mapping all live here. Reads the body as bytes so binary downloads and text/JSON
    /// responses share the same path; the API speaks UTF-8 for everything textual.
    /// </summary>
    private async Task<(HttpStatusCode StatusCode, byte[] Body)> SendCoreWithStatusAsync(HttpMethod method, string pathAndQuery, HttpContent? content, CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(method, new Uri(BaseUrl, pathAndQuery));
        ApplyHeaders(request);

        if (content is not null)
        {
            request.Content = content;
        }

        // The endpoint owns the timeout so behavior is identical for owned and injected
        // clients (we are not allowed to touch an injected client's Timeout).
        using var timeoutSource = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeoutSource.CancelAfter(Timeout);

        try
        {
            using var response = await _httpClient.SendAsync(request, timeoutSource.Token).ConfigureAwait(false);
            var bytes = await response.Content.ReadAsByteArrayAsync(timeoutSource.Token).ConfigureAwait(false);

            if (!response.IsSuccessStatusCode)
            {
                throw new VerdocsApiException(response.StatusCode, Encoding.UTF8.GetString(bytes));
            }

            return (response.StatusCode, bytes);
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            throw new TimeoutException($"The request to {pathAndQuery} did not complete within {Timeout.TotalSeconds:0.###} seconds.");
        }
    }
}
