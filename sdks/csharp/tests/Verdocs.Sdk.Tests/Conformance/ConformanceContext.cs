using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json.Nodes;
using Verdocs.Models;

namespace Verdocs.Sdk.Tests.Conformance;

/// <summary>
/// Shared state for the conformance lane: loaded credentials, one authenticated SDK endpoint,
/// and a plain HttpClient for the raw side of each comparison. Created once per test run and
/// left to the process to clean up.
/// </summary>
internal sealed class ConformanceContext
{
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

    internal static async Task<ConformanceContext> CreateAsync()
    {
        var settings = ConformanceEnv.TryLoad()
            ?? throw new InvalidOperationException(
                "Conformance tests need VERDOCS_API_BASE, VERDOCS_TEST_EMAIL, and VERDOCS_TEST_PASSWORD, "
                + "set in the environment or in the hub root .env file.");

        var sdk = new VerdocsEndpoint(new VerdocsEndpointOptions { BaseUrl = settings.ApiBase });
        var auth = await sdk.AuthenticateAsync(new AuthenticateRequest
        {
            Username = settings.Email,
            Password = settings.Password,
        });
        sdk.SetToken(auth.AccessToken);

        return new ConformanceContext(settings, new HttpClient(), sdk, auth.AccessToken);
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
