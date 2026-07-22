using System.Net;
using System.Text.Json.Nodes;
using Verdocs.Models;
using Xunit;

namespace Verdocs.Sdk.Tests.Conformance;

/// <summary>
/// The shared conformance lane defined by packages/conformance/fixtures.json: every covered
/// endpoint is called twice against live beta, once with a raw HttpClient and once with the
/// SDK, then status and normalized JSON are compared deeply (volatile keys masked, timestamps
/// canonicalized, null members dropped; ConformanceJson documents why). Entries under the
/// fixtures' frozen section are intentionally absent here. Skipped unless VERDOCS_CONFORMANCE=1
/// so the default dotnet test run stays offline; credentials come from the environment or
/// hub/.env. Shares the "conformance" collection with ChainTests so the chain's writes never
/// land between a case's raw call and its SDK call.
/// </summary>
[Collection("conformance")]
public sealed class ConformanceTests
{
    // Test names follow the fixture case ids so the case-to-SDK-call mapping stays obvious:
    // "authenticate" is endpoint.Auth.AuthenticateAsync, "users-me" is Users.GetMeAsync,
    // "profiles-current" is Profiles.GetCurrentAsync, "templates-list" is Templates.ListAsync,
    // "envelopes-list" is Envelopes.ListAsync, "organization-get" is Organizations.GetAsync,
    // "members-list" is Members.ListAsync, "groups-list" is Groups.ListAsync, and
    // "entitlements" is Organizations.GetEntitlementsAsync.

    public static TheoryData<string> Cases()
    {
        var data = new TheoryData<string>();
        foreach (var id in ConformanceFixtures.CaseIds)
        {
            data.Add(id);
        }

        // A fresh endpoint, so this case stands alone rather than reusing the shared session.
        using var endpoint = new VerdocsEndpoint(new VerdocsEndpointOptions { BaseUrl = context.Settings.ApiBase });
        var viaSdk = await endpoint.Auth.AuthenticateAsync(
            new AuthenticateRequest
            {
                Username = context.Settings.Email,
                Password = context.Settings.Password,
            },
            TestContext.Current.CancellationToken);

        Assert.Equal(ConformanceJson.NormalizeText(rawBody), ConformanceJson.NormalizeValue(viaSdk));
    }

    [Fact]
    public async Task UsersMe_MatchesRawHttp()
    {
        var context = await GetContextAsync();
        var fixtureCase = ConformanceFixtures.GetCase(caseId);

        var method = new HttpMethod(fixtureCase["method"]!.GetValue<string>());
        var auth = fixtureCase["auth"]?.GetValue<bool>() ?? false;
        var (status, rawBody) = await context.RawAsync(method, BuildPath(fixtureCase), auth, BuildBody(fixtureCase, context.Settings));
        Assert.Equal(HttpStatusCode.OK, status);

        var viaSdk = await context.Sdk.Users.GetMeAsync(TestContext.Current.CancellationToken);

        Assert.Equal(ConformanceJson.NormalizeText(rawBody), ConformanceJson.NormalizeValue(viaSdk));
    }

    [Fact]
    public async Task ProfilesCurrent_MatchesRawCurrentEntry()
    {
        var context = await GetContextAsync();

        var (status, rawBody) = await context.RawGetAsync("/v2/profiles");
        Assert.Equal(HttpStatusCode.OK, status);

        // The raw response is an array; the SDK returns the entry with current=true, so the
        // comparison target is that entry (fixtures.json, profiles-current note).
        var profiles = Assert.IsType<JsonArray>(JsonNode.Parse(rawBody));
        var rawCurrent = profiles.FirstOrDefault(entry => entry?["current"]?.GetValue<bool>() == true);
        Assert.NotNull(rawCurrent);

        var viaSdk = await context.Sdk.Profiles.GetCurrentAsync(TestContext.Current.CancellationToken);
        Assert.NotNull(viaSdk);

        Assert.Equal(ConformanceJson.Normalize(rawCurrent), ConformanceJson.NormalizeValue(viaSdk));
    }

    [Fact]
    public async Task TemplatesList_MatchesRawHttp()
    {
        var path = fixtureCase["path"]!.GetValue<string>();
        if (fixtureCase["query"] is not JsonObject query || query.Count == 0)
        {
            return path;
        }

        var pairs = query.Select(entry =>
            $"{Uri.EscapeDataString(entry.Key)}={Uri.EscapeDataString(entry.Value?.ToString() ?? string.Empty)}");
        return $"{path}?{string.Join("&", pairs)}";
    }

        var viaSdk = await context.Sdk.Templates.ListAsync(
            new GetTemplatesOptions
            {
                Visibility = TemplateVisibilityFilter.PrivateShared,
                Rows = 10,
                Page = 0,
            },
            TestContext.Current.CancellationToken);

        Assert.Equal(ConformanceJson.NormalizeText(rawBody), ConformanceJson.NormalizeValue(viaSdk));
    }

    [Fact]
    public async Task EnvelopesList_MatchesRawHttp()
    {
        var context = await GetContextAsync();

        var (status, rawBody) = await context.RawGetAsync("/v2/envelopes?rows=10&page=0");
        Assert.Equal(HttpStatusCode.OK, status);

        var viaSdk = await context.Sdk.Envelopes.ListAsync(
            new ListEnvelopesOptions
            {
                Rows = 10,
                Page = 0,
            },
            TestContext.Current.CancellationToken);

        Assert.Equal(ConformanceJson.NormalizeText(rawBody), ConformanceJson.NormalizeValue(viaSdk));
    }

    [Fact]
    public async Task OrganizationGet_MatchesRawHttp()
    {
        var context = await GetContextAsync();
        var organizationId = context.SessionOrganizationId();

        var (status, rawBody) = await context.RawGetAsync("/v2/organizations/" + Uri.EscapeDataString(organizationId));
        Assert.Equal(HttpStatusCode.OK, status);

        var viaSdk = await context.Sdk.Organizations.GetAsync(organizationId, TestContext.Current.CancellationToken);

        Assert.Equal(ConformanceJson.NormalizeText(rawBody), ConformanceJson.NormalizeValue(viaSdk));
    }

    [Fact]
    public async Task MembersList_MatchesRawHttp()
    {
        var context = await GetContextAsync();

        var (status, rawBody) = await context.RawGetAsync("/v2/organization-members");
        Assert.Equal(HttpStatusCode.OK, status);

        var viaSdk = await context.Sdk.Members.ListAsync(TestContext.Current.CancellationToken);

        Assert.Equal(ConformanceJson.NormalizeText(rawBody), ConformanceJson.NormalizeValue(viaSdk));
    }

    [Fact]
    public async Task GroupsList_MatchesRawHttp()
    {
        var context = await GetContextAsync();

        var (status, rawBody) = await context.RawGetAsync("/v2/organization-groups");
        Assert.Equal(HttpStatusCode.OK, status);

        var viaSdk = await context.Sdk.Groups.ListAsync(TestContext.Current.CancellationToken);

        Assert.Equal(ConformanceJson.NormalizeText(rawBody), ConformanceJson.NormalizeValue(viaSdk));
    }

    [Fact]
    public async Task Entitlements_MatchesRawHttp()
    {
        var context = await GetContextAsync();

        var (status, rawBody) = await context.RawGetAsync("/v2/organizations/entitlements");
        Assert.Equal(HttpStatusCode.OK, status);

        var viaSdk = await context.Sdk.Organizations.GetEntitlementsAsync(TestContext.Current.CancellationToken);

        Assert.Equal(ConformanceJson.NormalizeText(rawBody), ConformanceJson.NormalizeValue(viaSdk));
    }

    private static Task<ConformanceContext> GetContextAsync()
    {
        return ConformanceContext.GetSharedAsync();
    }
}
