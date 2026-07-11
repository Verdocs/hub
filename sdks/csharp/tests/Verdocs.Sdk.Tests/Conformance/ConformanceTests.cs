using System.Net;
using System.Text.Json.Nodes;
using Verdocs.Models;
using Xunit;

namespace Verdocs.Sdk.Tests.Conformance;

/// <summary>
/// The shared conformance lane defined by packages/conformance/fixtures.json: every covered
/// endpoint is called twice against live beta, once with a raw HttpClient and once with the
/// SDK, then status and volatile-normalized JSON are compared deeply. The star-toggle case is
/// frozen there and intentionally absent here. Skipped unless VERDOCS_CONFORMANCE=1 so the
/// default dotnet test run stays offline; credentials come from the environment or hub/.env.
/// </summary>
public sealed class ConformanceTests
{
    private static readonly Lazy<Task<ConformanceContext>> SharedContext = new(ConformanceContext.CreateAsync);

    [Fact]
    public async Task Authenticate_MatchesRawHttp()
    {
        var context = await GetContextAsync();

        var (status, rawBody) = await context.RawPostAsync("/v2/oauth2/token", new JsonObject
        {
            ["username"] = context.Settings.Email,
            ["password"] = context.Settings.Password,
            ["grant_type"] = "password",
        });
        Assert.Equal(HttpStatusCode.OK, status);

        // A fresh endpoint, so this case stands alone rather than reusing the shared session.
        using var endpoint = new VerdocsEndpoint(new VerdocsEndpointOptions { BaseUrl = context.Settings.ApiBase });
        var viaSdk = await endpoint.AuthenticateAsync(
            new AuthenticateRequest
            {
                Username = context.Settings.Email,
                Password = context.Settings.Password,
            },
            TestContext.Current.CancellationToken);

        Assert.Equal(VolatileJson.NormalizeText(rawBody), VolatileJson.NormalizeValue(viaSdk));
    }

    [Fact]
    public async Task GetMyUser_MatchesRawHttp()
    {
        var context = await GetContextAsync();

        var (status, rawBody) = await context.RawGetAsync("/v2/users/me");
        Assert.Equal(HttpStatusCode.OK, status);

        var viaSdk = await context.Sdk.GetMyUserAsync(TestContext.Current.CancellationToken);

        Assert.Equal(VolatileJson.NormalizeText(rawBody), VolatileJson.NormalizeValue(viaSdk));
    }

    [Fact]
    public async Task GetCurrentProfile_MatchesRawCurrentEntry()
    {
        var context = await GetContextAsync();

        var (status, rawBody) = await context.RawGetAsync("/v2/profiles");
        Assert.Equal(HttpStatusCode.OK, status);

        // The raw response is an array; the SDK returns the entry with current=true, so the
        // comparison target is that entry (fixtures.json, profiles-current note).
        var profiles = Assert.IsType<JsonArray>(JsonNode.Parse(rawBody));
        var rawCurrent = profiles.FirstOrDefault(entry => entry?["current"]?.GetValue<bool>() == true);
        Assert.NotNull(rawCurrent);

        var viaSdk = await context.Sdk.GetCurrentProfileAsync(TestContext.Current.CancellationToken);
        Assert.NotNull(viaSdk);

        Assert.Equal(VolatileJson.Normalize(rawCurrent), VolatileJson.NormalizeValue(viaSdk));
    }

    [Fact]
    public async Task GetTemplates_MatchesRawHttp()
    {
        var context = await GetContextAsync();

        var (status, rawBody) = await context.RawGetAsync("/v2/templates?visibility=private_shared&rows=10&page=0");
        Assert.Equal(HttpStatusCode.OK, status);

        var viaSdk = await context.Sdk.GetTemplatesAsync(
            new GetTemplatesOptions
            {
                Visibility = TemplateVisibilityFilter.PrivateShared,
                Rows = 10,
                Page = 0,
            },
            TestContext.Current.CancellationToken);

        Assert.Equal(VolatileJson.NormalizeText(rawBody), VolatileJson.NormalizeValue(viaSdk));
    }

    private static Task<ConformanceContext> GetContextAsync()
    {
        if (Environment.GetEnvironmentVariable("VERDOCS_CONFORMANCE") != "1")
        {
            Assert.Skip("Live conformance lane. Set VERDOCS_CONFORMANCE=1 (credentials from the environment or hub/.env) to run it.");
        }

        return SharedContext.Value;
    }
}
