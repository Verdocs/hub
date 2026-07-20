using System.Globalization;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Verdocs.Models;

namespace Verdocs;

/// <summary>
/// A connection and authorization context for calling the Verdocs platform APIs. An endpoint
/// carries exactly one session, either a user session or a signing session; run two endpoint
/// instances when both are needed at once (an authenticated user signing an envelope, for
/// example). Ephemeral signing endpoints can be created, used for the signing calls, and
/// discarded when signing completes.
///
/// <example>
/// <code>
/// using var endpoint = new VerdocsEndpoint();
/// var auth = await endpoint.AuthenticateAsync(new PasswordGrantRequest
/// {
///     Username = "you@example.com",
///     Password = "PASSWORD",
/// });
/// endpoint.SetToken(auth.AccessToken);
///
/// var templates = await endpoint.GetTemplatesAsync(new GetTemplatesOptions { Rows = 10 });
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

    /// <summary>
    /// Stores the access token applied to subsequent requests, along with its decoded session
    /// metadata. Passing null, an unparseable token, or an expired token clears the session
    /// instead. Token persistence is the caller's responsibility; unlike the JS SDK there is
    /// no localStorage equivalent here.
    /// </summary>
    /// <param name="token">The access token returned by <see cref="AuthenticateAsync"/>, or null to clear.</param>
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

    /// <summary>
    /// Authenticates to Verdocs and returns the session tokens. Call <see cref="SetToken"/>
    /// with the access token to apply it to this endpoint.
    ///
    /// <example>
    /// <code>
    /// var auth = await endpoint.AuthenticateAsync(new PasswordGrantRequest
    /// {
    ///     Username = "you@example.com",
    ///     Password = "PASSWORD",
    /// });
    /// endpoint.SetToken(auth.AccessToken);
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="request">OAuth2 token request (password, client_credentials, refresh_token, or authorization_code).</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>Authentication tokens and expiration details.</returns>
    /// <exception cref="VerdocsApiException">The API rejected the credentials or the call failed.</exception>
    /// <sdkOperation>auth.authenticate</sdkOperation>
    /// <sdkGroup>Auth</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<AuthenticateResponse> AuthenticateAsync(AuthenticateRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        return SendAsync<AuthenticateResponse>(HttpMethod.Post, "/v2/oauth2/token", request, cancellationToken);
    }

    /// <summary>
    /// Builds the URL that starts an OAuth2 authorization code flow. Redirect the user's
    /// browser to this URL. After they authenticate and authorize, they land on redirect_uri
    /// with a code query parameter that <see cref="AuthenticateAsync"/> can exchange with
    /// grant_type authorization_code.
    ///
    /// <example>
    /// <code>
    /// var url = endpoint.GetOAuth2AuthorizeUrl(new OAuth2AuthorizeParams
    /// {
    ///     ClientId = "your-client-id",
    ///     RedirectUri = "https://your-app.com/callback",
    ///     State = "random-csrf-token",
    /// });
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="parameters">client_id, redirect_uri, and optional state/scope.</param>
    /// <returns>The absolute authorize URL.</returns>
    /// <sdkOperation>auth.getOAuth2AuthorizeUrl</sdkOperation>
    /// <sdkGroup>Auth</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public string GetOAuth2AuthorizeUrl(OAuth2AuthorizeParams parameters)
    {
        ArgumentNullException.ThrowIfNull(parameters);

        var builder = new UriBuilder(new Uri(BaseUrl, "/v2/oauth2/authorize"));
        var query = new List<string>
        {
            "client_id=" + Uri.EscapeDataString(parameters.ClientId),
            "redirect_uri=" + Uri.EscapeDataString(parameters.RedirectUri),
            "response_type=" + Uri.EscapeDataString(parameters.ResponseType),
        };
        if (parameters.State is { } state)
        {
            query.Add("state=" + Uri.EscapeDataString(state));
        }

        if (parameters.Scope is { } scope)
        {
            query.Add("scope=" + Uri.EscapeDataString(scope));
        }

        builder.Query = string.Join("&", query);
        return builder.Uri.ToString();
    }

    /// <summary>
    /// Refreshes the caller's session and tokens before they expire.
    ///
    /// <example>
    /// <code>
    /// var tokens = await endpoint.RefreshTokenAsync(previous.RefreshToken);
    /// endpoint.SetToken(tokens.AccessToken);
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="refreshToken">The refresh token from a prior authenticate call.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>A fresh token set.</returns>
    /// <exception cref="VerdocsApiException">The refresh token was rejected or the call failed.</exception>
    /// <sdkOperation>auth.refreshToken</sdkOperation>
    /// <sdkGroup>Auth</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<AuthenticateResponse> RefreshTokenAsync(string refreshToken, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(refreshToken);
        return AuthenticateAsync(new RefreshTokenGrantRequest { RefreshToken = refreshToken }, cancellationToken);
    }

    /// <summary>
    /// Updates the caller's password when the old password is known.
    ///
    /// <example>
    /// <code>
    /// var result = await endpoint.ChangePasswordAsync(new ChangePasswordRequest
    /// {
    ///     OldPassword = "old",
    ///     NewPassword = "new",
    /// });
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="request">Current and new passwords.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>Status and message from the server.</returns>
    /// <exception cref="VerdocsApiException">The call failed.</exception>
    /// <sdkOperation>auth.changePassword</sdkOperation>
    /// <sdkGroup>Auth</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<ChangePasswordResponse> ChangePasswordAsync(ChangePasswordRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        return SendAsync<ChangePasswordResponse>(HttpMethod.Post, "/v2/users/change-password", request, cancellationToken);
    }

    /// <summary>
    /// Requests or completes a password reset when the old password is unknown. Omit code and
    /// new_password to start the reset; include both to finish it.
    ///
    /// <example>
    /// <code>
    /// await endpoint.ResetPasswordAsync(new ResetPasswordRequest { Email = "you@example.com" });
    /// await endpoint.ResetPasswordAsync(new ResetPasswordRequest
    /// {
    ///     Email = "you@example.com",
    ///     Code = "123456",
    ///     NewPassword = "new",
    /// });
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="request">Email, and optionally the emailed code plus new password.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>Whether the call succeeded.</returns>
    /// <exception cref="VerdocsApiException">The call failed.</exception>
    /// <sdkOperation>auth.resetPassword</sdkOperation>
    /// <sdkGroup>Auth</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<ResetPasswordResponse> ResetPasswordAsync(ResetPasswordRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        return SendAsync<ResetPasswordResponse>(HttpMethod.Post, "/v2/users/reset-password", request, cancellationToken);
    }

    /// <summary>
    /// Resends email verification for a partially authenticated user. Pass accessToken to
    /// identify the user when this endpoint is not already authenticated with that token.
    ///
    /// <example>
    /// <code>
    /// await endpoint.ResendVerificationAsync();
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="accessToken">Optional bearer token used only for this request.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>Confirmation that the resend was queued.</returns>
    /// <exception cref="VerdocsApiException">The call failed.</exception>
    /// <sdkOperation>auth.resendVerification</sdkOperation>
    /// <sdkGroup>Auth</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<ResendVerificationResponse> ResendVerificationAsync(string? accessToken = null, CancellationToken cancellationToken = default)
    {
        Dictionary<string, string>? headers = null;
        if (accessToken is not null)
        {
            headers = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["Authorization"] = "Bearer " + accessToken,
            };
        }

        return SendAsync<ResendVerificationResponse>(
            HttpMethod.Post,
            "/v2/users/resend-verification",
            body: new { },
            cancellationToken,
            headers);
    }

    /// <summary>
    /// Verifies email when the user is unauthenticated but email and token are known.
    ///
    /// <example>
    /// <code>
    /// var tokens = await endpoint.VerifyEmailAsync(new VerifyEmailRequest
    /// {
    ///     Email = "you@example.com",
    ///     Token = "verify-token",
    /// });
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="request">Email address and verification token.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>Updated authentication tokens.</returns>
    /// <exception cref="VerdocsApiException">The call failed.</exception>
    /// <sdkOperation>auth.verifyEmail</sdkOperation>
    /// <sdkGroup>Auth</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<AuthenticateResponse> VerifyEmailAsync(VerifyEmailRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        return SendAsync<AuthenticateResponse>(HttpMethod.Post, "/v2/users/verify", request, cancellationToken);
    }

    /// <summary>
    /// Gets the caller's current user record.
    ///
    /// <example>
    /// <code>
    /// var user = await endpoint.GetMyUserAsync();
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The caller's user record.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the session is invalid.</exception>
    /// <sdkOperation>auth.getMyUser</sdkOperation>
    /// <sdkGroup>Auth</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<User> GetMyUserAsync(CancellationToken cancellationToken = default)
    {
        return SendAsync<User>(HttpMethod.Get, "/v2/users/me", null, cancellationToken);
    }

    /// <summary>
    /// Gets the caller's current profile. A user has one profile per organization membership
    /// and exactly one is current at a time; operations are performed as that profile.
    /// </summary>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The profile marked current, or null if the caller has none.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the session is invalid.</exception>
    public async Task<Profile?> GetCurrentProfileAsync(CancellationToken cancellationToken = default)
    {
        var profiles = await SendAsync<List<Profile>>(HttpMethod.Get, "/v2/profiles", null, cancellationToken)
            .ConfigureAwait(false);
        return profiles.Find(profile => profile.Current);
    }

    /// <summary>
    /// Gets the templates accessible to the caller, with optional filters.
    ///
    /// <example>
    /// <code>
    /// var page = await endpoint.GetTemplatesAsync(new GetTemplatesOptions
    /// {
    ///     Visibility = TemplateVisibilityFilter.PrivateShared,
    ///     Rows = 10,
    ///     Page = 0,
    /// });
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="options">Optional filters, sorting, and paging.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>One page of templates plus paging counts.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the session is invalid.</exception>
    public Task<TemplateList> GetTemplatesAsync(GetTemplatesOptions? options = null, CancellationToken cancellationToken = default)
    {
        return SendAsync<TemplateList>(HttpMethod.Get, BuildTemplatesPath(options), null, cancellationToken);
    }

    /// <summary>
    /// Gets one template by its ID. The caller must have at least view access to it. The
    /// detail response includes the template's roles, documents, and fields, which the list
    /// response omits.
    /// </summary>
    /// <param name="templateId">The template's unique ID.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The requested template.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the template was not found.</exception>
    public Task<Template> GetTemplateAsync(string templateId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(templateId);
        return SendAsync<Template>(HttpMethod.Get, "/v2/templates/" + Uri.EscapeDataString(templateId), null, cancellationToken);
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

    private static string BuildTemplatesPath(GetTemplatesOptions? options)
    {
        const string path = "/v2/templates";
        if (options is null)
        {
            return path;
        }

        var parameters = new List<string>();

        void Add(string key, string value) => parameters.Add(key + "=" + Uri.EscapeDataString(value));

        if (options.Q is { } q)
        {
            Add("q", q);
        }

        if (options.IsStarred is { } isStarred)
        {
            Add("is_starred", isStarred ? "true" : "false");
        }

        if (options.IsCreator is { } isCreator)
        {
            Add("is_creator", isCreator ? "true" : "false");
        }

        if (options.Visibility is { } visibility)
        {
            Add("visibility", ToWireValue(visibility));
        }

        if (options.SortBy is { } sortBy)
        {
            Add("sort_by", ToWireValue(sortBy));
        }

        if (options.Ascending is { } ascending)
        {
            Add("ascending", ascending ? "true" : "false");
        }

        if (options.Rows is { } rows)
        {
            Add("rows", rows.ToString(CultureInfo.InvariantCulture));
        }

        if (options.Page is { } page)
        {
            Add("page", page.ToString(CultureInfo.InvariantCulture));
        }

        return parameters.Count == 0 ? path : path + "?" + string.Join("&", parameters);
    }

    private static string ToWireValue(TemplateVisibilityFilter visibility) => visibility switch
    {
        TemplateVisibilityFilter.PrivateShared => "private_shared",
        TemplateVisibilityFilter.Private => "private",
        TemplateVisibilityFilter.Shared => "shared",
        TemplateVisibilityFilter.Public => "public",
        _ => throw new ArgumentOutOfRangeException(nameof(visibility)),
    };

    private static string ToWireValue(TemplateSortBy sortBy) => sortBy switch
    {
        TemplateSortBy.CreatedAt => "created_at",
        TemplateSortBy.UpdatedAt => "updated_at",
        TemplateSortBy.Name => "name",
        TemplateSortBy.LastUsedAt => "last_used_at",
        TemplateSortBy.Counter => "counter",
        TemplateSortBy.StarCounter => "star_counter",
        _ => throw new ArgumentOutOfRangeException(nameof(sortBy)),
    };

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

    private async Task<TResponse> SendAsync<TResponse>(
        HttpMethod method,
        string pathAndQuery,
        object? body,
        CancellationToken cancellationToken,
        IReadOnlyDictionary<string, string>? extraHeaders = null)
    {
        using var request = new HttpRequestMessage(method, new Uri(BaseUrl, pathAndQuery));
        ApplyHeaders(request);

        if (extraHeaders is not null)
        {
            foreach (var header in extraHeaders)
            {
                request.Headers.Remove(header.Key);
                request.Headers.TryAddWithoutValidation(header.Key, header.Value);
            }
        }

        if (body is not null)
        {
            // AuthenticateRequest must serialize as the polymorphic base so grant_type is written.
            request.Content = body is AuthenticateRequest authRequest
                ? JsonContent.Create(authRequest, mediaType: null, options: VerdocsJson.Options)
                : JsonContent.Create(body, body.GetType(), mediaType: null, VerdocsJson.Options);
        }

        // The endpoint owns the timeout so behavior is identical for owned and injected
        // clients (we are not allowed to touch an injected client's Timeout).
        using var timeoutSource = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeoutSource.CancelAfter(Timeout);

        try
        {
            using var response = await _httpClient.SendAsync(request, timeoutSource.Token).ConfigureAwait(false);
            var responseBody = await response.Content.ReadAsStringAsync(timeoutSource.Token).ConfigureAwait(false);

            if (!response.IsSuccessStatusCode)
            {
                throw new VerdocsApiException(response.StatusCode, responseBody);
            }

            try
            {
                return JsonSerializer.Deserialize<TResponse>(responseBody, VerdocsJson.Options)
                    ?? throw new VerdocsApiException(
                        response.StatusCode,
                        responseBody,
                        "The Verdocs API returned an empty body where a value was required.");
            }
            catch (JsonException exception)
            {
                throw new VerdocsApiException(
                    response.StatusCode,
                    responseBody,
                    "The Verdocs API response could not be parsed.",
                    exception);
            }
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            throw new TimeoutException($"The request to {pathAndQuery} did not complete within {Timeout.TotalSeconds:0.###} seconds.");
        }
    }
}
