using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json.Nodes;
using Verdocs.Models;
using Xunit;

namespace Verdocs.Sdk.Tests.Conformance;

/// <summary>
/// Shared state for the conformance lane: loaded credentials, one authenticated SDK endpoint,
/// and a plain HttpClient for the raw side of each comparison. Created once per test run,
/// shared by the case facts and the chain, and left to the process to clean up.
/// </summary>
internal sealed class ConformanceContext
{
    private static readonly Lazy<Task<ConformanceContext>> Shared = new(CreateAsync);

    private ConformanceContext(ConformanceSettings settings, HttpClient raw, VerdocsEndpoint sdk, string token)
    {
        Settings = settings;
        Raw = raw;
        Sdk = sdk;
        Token = token;
    }

    internal ConformanceSettings Settings { get; }

    internal HttpClient Raw { get; }

    internal VerdocsEndpoint Sdk { get; }

    internal string Token { get; }

    /// <summary>
    /// The one context every conformance fact shares, behind the lane's gate: skipped unless
    /// VERDOCS_CONFORMANCE=1 so the default dotnet test run stays offline. The gate runs
    /// before the Lazy is touched, so an ungated run never authenticates.
    /// </summary>
    internal static Task<ConformanceContext> GetSharedAsync()
    {
        if (Environment.GetEnvironmentVariable("VERDOCS_CONFORMANCE") != "1")
        {
            Assert.Skip("Live conformance lane. Set VERDOCS_CONFORMANCE=1 (credentials from the environment or hub/.env) to run it.");
        }

        return Shared.Value;
    }

    /// <summary>
    /// Resolves the fixtures' $SESSION.organization_id placeholder from the authenticated
    /// session's claims, per the fixtures.json contract.
    /// </summary>
    internal string SessionOrganizationId()
    {
        var organizationId = Sdk.Session?.OrganizationId;
        Assert.False(string.IsNullOrEmpty(organizationId), "The authenticated session carries no organization_id claim.");
        return organizationId!;
    }

    private static async Task<ConformanceContext> CreateAsync()
    {
        var settings = ConformanceEnv.TryLoad()
            ?? throw new InvalidOperationException(
                "Conformance tests need VERDOCS_API_BASE, VERDOCS_TEST_EMAIL, and VERDOCS_TEST_PASSWORD, "
                + "set in the environment or in the hub root .env file.");

        var sdk = new VerdocsEndpoint(new VerdocsEndpointOptions { BaseUrl = settings.ApiBase });
        var auth = await sdk.Auth.AuthenticateAsync(new PasswordGrantRequest
        {
            Username = settings.Email,
            Password = settings.Password,
        });
        sdk.SetToken(auth.AccessToken);

        return new ConformanceContext(settings, new HttpClient(), sdk, auth.AccessToken);
    }

    /// <summary>The common case: an authenticated GET with no body.</summary>
    internal Task<(HttpStatusCode Status, string Body)> RawGetAsync(string pathAndQuery)
    {
        return RawAsync(HttpMethod.Get, pathAndQuery, auth: true, body: null);
    }

    /// <summary>The raw side of a case: a plain HTTP call with no SDK code in the path.</summary>
    internal async Task<(HttpStatusCode Status, string Body)> RawAsync(HttpMethod method, string pathAndQuery, bool auth, JsonNode? body)
    {
        using var request = new HttpRequestMessage(method, new Uri(Sdk.BaseUrl, pathAndQuery));

        if (auth)
        {
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", Token);
        }

        if (body is not null)
        {
            request.Content = new StringContent(body.ToJsonString(), Encoding.UTF8, "application/json");
        }

        using var response = await Raw.SendAsync(request);
        return (response.StatusCode, await response.Content.ReadAsStringAsync());
    }
}
