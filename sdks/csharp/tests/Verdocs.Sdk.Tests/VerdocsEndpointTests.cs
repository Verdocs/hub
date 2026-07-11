using Xunit;

namespace Verdocs.Sdk.Tests;

/// <summary>Construction, session handling, and per-session-type header behavior.</summary>
public sealed class VerdocsEndpointTests
{
    private const string TestBaseUrl = "https://api.test";

    [Fact]
    public void Constructor_Defaults_TargetProductionAsUserSession()
    {
        using var endpoint = new VerdocsEndpoint();

        Assert.Equal(new Uri("https://api.verdocs.com/"), endpoint.BaseUrl);
        Assert.Equal(TimeSpan.FromSeconds(60), endpoint.Timeout);
        Assert.Equal(SessionType.User, endpoint.SessionType);
        Assert.Null(endpoint.ClientId);
        Assert.Null(endpoint.Token);
        Assert.Null(endpoint.Session);
    }

    [Fact]
    public void Constructor_Options_AreApplied()
    {
        using var endpoint = new VerdocsEndpoint(new VerdocsEndpointOptions
        {
            BaseUrl = "https://stage-api.verdocs.com",
            Timeout = TimeSpan.FromSeconds(5),
            SessionType = SessionType.Signing,
            ClientId = "client-1234",
        });

        Assert.Equal(new Uri("https://stage-api.verdocs.com/"), endpoint.BaseUrl);
        Assert.Equal(TimeSpan.FromSeconds(5), endpoint.Timeout);
        Assert.Equal(SessionType.Signing, endpoint.SessionType);
        Assert.Equal("client-1234", endpoint.ClientId);
    }

    [Fact]
    public void Constructor_InvalidBaseUrl_ThrowsArgumentException()
    {
        Assert.Throws<ArgumentException>(() => new VerdocsEndpoint(new VerdocsEndpointOptions { BaseUrl = "not a url" }));
    }

    [Fact]
    public void Constructor_NonPositiveTimeout_ThrowsArgumentException()
    {
        Assert.Throws<ArgumentException>(() => new VerdocsEndpoint(new VerdocsEndpointOptions { Timeout = TimeSpan.Zero }));
    }

    [Fact]
    public void Default_ReturnsTheSameInstance()
    {
        Assert.Same(VerdocsEndpoint.Default, VerdocsEndpoint.Default);
    }

    [Fact]
    public void Dispose_SuppliedClient_IsLeftAlone()
    {
        using var handler = new FakeHttpMessageHandler();
        using var client = new HttpClient(handler);

        var endpoint = new VerdocsEndpoint(new VerdocsEndpointOptions { BaseUrl = TestBaseUrl }, client);
        endpoint.Dispose();

        Assert.False(handler.Disposed);
    }

    [Fact]
    public void SetToken_ValidUserToken_SetsSessionMetadata()
    {
        using var endpoint = new VerdocsEndpoint();
        var token = TestTokens.Create();

        var result = endpoint.SetToken(token);

        Assert.Same(endpoint, result);
        Assert.Equal(token, endpoint.Token);
        Assert.NotNull(endpoint.Session);
        Assert.Equal(SessionType.User, endpoint.Session.SessionType);
        Assert.Equal("user-1234", endpoint.Session.Sub);
        Assert.Equal("test@example.com", endpoint.Session.Email);
        Assert.Equal("profile-1234", endpoint.Session.ProfileId);
        Assert.Equal("org-1234", endpoint.Session.OrganizationId);
        Assert.Equal(false, endpoint.Session.GlobalAdmin);
        Assert.NotNull(endpoint.Session.ExpiresAt);
    }

    [Fact]
    public void SetToken_SigningClaim_DerivesSigningSessionType()
    {
        using var endpoint = new VerdocsEndpoint();

        endpoint.SetToken(TestTokens.Create("signing"));

        Assert.Equal(SessionType.Signing, endpoint.SessionType);
        Assert.NotNull(endpoint.Session);
        Assert.Equal("envelope-1234", endpoint.Session.EnvelopeId);
        Assert.Equal("Recipient 1", endpoint.Session.RoleName);
        Assert.Null(endpoint.Session.OrganizationId);
    }

    [Fact]
    public void SetToken_ExplicitSessionType_WinsOverClaim()
    {
        using var endpoint = new VerdocsEndpoint();

        endpoint.SetToken(TestTokens.Create("user"), SessionType.Signing);

        Assert.Equal(SessionType.Signing, endpoint.SessionType);
    }

    [Fact]
    public void SetToken_ExpiredToken_ClearsSession()
    {
        using var endpoint = new VerdocsEndpoint();
        endpoint.SetToken(TestTokens.Create());

        endpoint.SetToken(TestTokens.Create(expOffsetSeconds: -3600));

        Assert.Null(endpoint.Token);
        Assert.Null(endpoint.Session);
    }

    [Fact]
    public void SetToken_MalformedToken_ClearsSession()
    {
        using var endpoint = new VerdocsEndpoint();
        endpoint.SetToken(TestTokens.Create());

        endpoint.SetToken("not-a-jwt");

        Assert.Null(endpoint.Token);
        Assert.Null(endpoint.Session);
    }

    [Fact]
    public void SetToken_Null_ClearsSession()
    {
        using var endpoint = new VerdocsEndpoint();
        endpoint.SetToken(TestTokens.Create());

        endpoint.SetToken(null);

        Assert.Null(endpoint.Token);
        Assert.Null(endpoint.Session);
    }

    [Fact]
    public async Task Request_UserSession_SendsAuthorizationHeader()
    {
        var handler = new FakeHttpMessageHandler();
        using var client = new HttpClient(handler);
        using var endpoint = new VerdocsEndpoint(new VerdocsEndpointOptions { BaseUrl = TestBaseUrl }, client);
        var token = TestTokens.Create();
        endpoint.SetToken(token);
        handler.Enqueue(System.Net.HttpStatusCode.OK, SamplePayloads.User);

        await endpoint.GetMyUserAsync(TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal("Bearer " + token, request.Headers["Authorization"]);
        Assert.False(request.Headers.ContainsKey("signer"));
    }

    [Fact]
    public async Task Request_SigningSession_SendsSignerHeaderInsteadOfAuthorization()
    {
        var handler = new FakeHttpMessageHandler();
        using var client = new HttpClient(handler);
        using var endpoint = new VerdocsEndpoint(new VerdocsEndpointOptions { BaseUrl = TestBaseUrl }, client);
        var token = TestTokens.Create("signing");
        endpoint.SetToken(token);
        handler.Enqueue(System.Net.HttpStatusCode.OK, SamplePayloads.User);

        await endpoint.GetMyUserAsync(TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal("Bearer " + token, request.Headers["signer"]);
        Assert.False(request.Headers.ContainsKey("Authorization"));
    }

    [Fact]
    public async Task Request_AfterClearSession_SendsNoAuthHeaders()
    {
        var handler = new FakeHttpMessageHandler();
        using var client = new HttpClient(handler);
        using var endpoint = new VerdocsEndpoint(new VerdocsEndpointOptions { BaseUrl = TestBaseUrl }, client);
        endpoint.SetToken(TestTokens.Create());
        endpoint.ClearSession();
        handler.Enqueue(System.Net.HttpStatusCode.OK, SamplePayloads.User);

        await endpoint.GetMyUserAsync(TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.False(request.Headers.ContainsKey("Authorization"));
        Assert.False(request.Headers.ContainsKey("signer"));
    }

    [Fact]
    public async Task Request_WithClientId_SendsXClientIdHeader()
    {
        var handler = new FakeHttpMessageHandler();
        using var client = new HttpClient(handler);
        using var endpoint = new VerdocsEndpoint(
            new VerdocsEndpointOptions { BaseUrl = TestBaseUrl, ClientId = "client-1234" },
            client);
        handler.Enqueue(System.Net.HttpStatusCode.OK, SamplePayloads.User);

        await endpoint.GetMyUserAsync(TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal("client-1234", request.Headers["X-Client-ID"]);
    }

    [Fact]
    public async Task Request_WithoutClientId_OmitsXClientIdHeader()
    {
        var handler = new FakeHttpMessageHandler();
        using var client = new HttpClient(handler);
        using var endpoint = new VerdocsEndpoint(new VerdocsEndpointOptions { BaseUrl = TestBaseUrl }, client);
        handler.Enqueue(System.Net.HttpStatusCode.OK, SamplePayloads.User);

        await endpoint.GetMyUserAsync(TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.False(request.Headers.ContainsKey("X-Client-ID"));
    }
}
