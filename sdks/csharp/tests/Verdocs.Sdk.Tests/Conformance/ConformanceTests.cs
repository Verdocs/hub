using System.Net;
using System.Text.Json.Nodes;
using Verdocs.Models;
using Xunit;

namespace Verdocs.Sdk.Tests.Conformance;

/// <summary>
/// The shared conformance lane defined by packages/conformance/fixtures.json: every covered
/// endpoint is called twice against live beta, once with a raw HttpClient and once with the SDK,
/// then status and normalized JSON are compared deeply (volatile keys masked, timestamps
/// canonicalized, null members dropped; ConformanceJson documents why). The theory below is
/// parametrized straight from fixtures.json's "cases" array, the same contract the TS
/// (it.each(fixtures.cases)) and pytest (pytest_generate_tests) lanes parametrize from, so a
/// case added to that file shows up here automatically and fails loudly until CallSdkForCaseAsync
/// grows a matching arm. Entries under fixtures' "frozen" section are absent from "cases" and so
/// never appear here either. Skipped unless VERDOCS_CONFORMANCE=1 so the default dotnet test run
/// stays offline; credentials come from the environment or hub/.env. Shares the "conformance"
/// collection with ChainTests so the chain's writes never land between a case's raw call and its
/// SDK call.
/// </summary>
[Collection("conformance")]
public sealed class ConformanceTests
{
    [Theory]
    [MemberData(nameof(ConformanceFixtures.CaseData), MemberType = typeof(ConformanceFixtures))]
    public async Task FixtureCase_MatchesRawHttp(ConformanceCase kase)
    {
        var context = await ConformanceContext.GetSharedAsync();
        var cancellationToken = TestContext.Current.CancellationToken;

        var (status, rawBody) = await CallRawForCaseAsync(context, kase);
        Assert.Equal(HttpStatusCode.OK, status);

        var viaSdk = await CallSdkForCaseAsync(context, kase, cancellationToken);
        Assert.NotNull(viaSdk);

        JsonNode? reference = JsonNode.Parse(rawBody);
        if (kase.Id == "profiles-current")
        {
            // The raw response is an array; the SDK returns the entry with current=true, so
            // that entry is the comparison target (fixtures.json, profiles-current note).
            var profiles = Assert.IsType<JsonArray>(reference);
            reference = profiles.FirstOrDefault(entry => entry?["current"]?.GetValue<bool>() == true);
            Assert.NotNull(reference);
        }

        Assert.Equal(ConformanceJson.Normalize(reference), ConformanceJson.NormalizeValue(viaSdk));
    }

    // The three facts below share the fixture theory's shape (call raw and SDK, compare) but
    // aren't cases: each needs an id only a prior list call can produce. A test account with
    // none of a given resource skips rather than fails, the same convention conformance.spec.ts's
    // group and brand detail checks use.

    [Fact]
    public async Task GroupDetail_MatchesRawHttp()
    {
        var context = await ConformanceContext.GetSharedAsync();
        var cancellationToken = TestContext.Current.CancellationToken;

        var groups = await context.Sdk.Groups.ListAsync(cancellationToken);
        if (groups.Count == 0)
        {
            Assert.Skip("No groups on the test account; group detail check skipped.");
        }

        var group = groups[0];
        var (status, rawBody) = await context.RawGetAsync("/v2/organization-groups/" + Uri.EscapeDataString(group.Id));
        Assert.Equal(HttpStatusCode.OK, status);

        var viaSdk = await context.Sdk.Groups.GetAsync(group.Id, cancellationToken);
        Assert.Equal(ConformanceJson.NormalizeText(rawBody), ConformanceJson.NormalizeValue(viaSdk));
    }

    [Fact]
    public async Task BrandDetail_MatchesRawHttp()
    {
        var context = await ConformanceContext.GetSharedAsync();
        var cancellationToken = TestContext.Current.CancellationToken;
        var organizationId = context.SessionOrganizationId();

        var brands = await context.Sdk.Brands.ListAsync(organizationId, cancellationToken);
        if (brands.Count == 0)
        {
            Assert.Skip("No brands on the test account; brand detail check skipped.");
        }

        var brand = brands[0];
        var (status, rawBody) = await context.RawGetAsync(
            "/v2/organizations/" + Uri.EscapeDataString(organizationId) + "/brands/" + Uri.EscapeDataString(brand.Id));
        Assert.Equal(HttpStatusCode.OK, status);

        var viaSdk = await context.Sdk.Brands.GetAsync(organizationId, brand.Id, cancellationToken);
        Assert.Equal(ConformanceJson.NormalizeText(rawBody), ConformanceJson.NormalizeValue(viaSdk));
    }

    [Fact]
    public async Task NotificationTemplateDetail_MatchesRawHttp()
    {
        var context = await ConformanceContext.GetSharedAsync();
        var cancellationToken = TestContext.Current.CancellationToken;

        var templates = await context.Sdk.NotificationTemplates.ListAsync(cancellationToken);
        if (templates.Count == 0)
        {
            Assert.Skip("No notification templates on the test account; detail check skipped.");
        }

        var template = templates[0];
        var (status, rawBody) = await context.RawGetAsync("/v2/notifications/templates/" + Uri.EscapeDataString(template.Id));
        Assert.Equal(HttpStatusCode.OK, status);

        var viaSdk = await context.Sdk.NotificationTemplates.GetAsync(template.Id, cancellationToken);
        Assert.Equal(ConformanceJson.NormalizeText(rawBody), ConformanceJson.NormalizeValue(viaSdk));
    }

    /// <summary>The raw side of a case: resolves path placeholders and query, no SDK in the path.</summary>
    private static async Task<(HttpStatusCode Status, string Body)> CallRawForCaseAsync(ConformanceContext context, ConformanceCase kase)
    {
        var path = kase.Path.Contains("$SESSION.organization_id")
            ? kase.Path.Replace("$SESSION.organization_id", context.SessionOrganizationId())
            : kase.Path;

        var body = kase.Body is null ? null : SubstituteEnv(kase.Body, context.Settings);

        return await context.RawAsync(new HttpMethod(kase.Method), path + BuildQuery(kase.Query), kase.Auth, body);
    }

    /// <summary>
    /// Maps each fixture case's "sdk" field, an @sdkOperation id, to the actual typed SDK call.
    /// This is the one hand-written piece per case; everything else (the raw call, the status
    /// check, and the comparison) is generic and shared by every case, mirroring
    /// conformance.spec.ts's callSdkForCase and test_conformance.py's call_sdk.
    /// </summary>
    private static async Task<object?> CallSdkForCaseAsync(ConformanceContext context, ConformanceCase kase, CancellationToken cancellationToken)
    {
        switch (kase.Sdk)
        {
            case "auth.authenticate":
                // A fresh endpoint proves authenticate needs no existing session.
                using (var fresh = new VerdocsEndpoint(new VerdocsEndpointOptions { BaseUrl = context.Settings.ApiBase }))
                {
                    return await fresh.Auth.AuthenticateAsync(
                        new PasswordGrantRequest { Username = context.Settings.Email, Password = context.Settings.Password },
                        cancellationToken);
                }

            case "auth.getMyUser":
                return await context.Sdk.Users.GetMeAsync(cancellationToken);
            case "profile.getCurrentProfile":
                return await context.Sdk.Profiles.GetCurrentAsync(cancellationToken);
            case "profile.getProfiles":
                return await context.Sdk.Profiles.ListAsync(cancellationToken);
            case "notification.getNotifications":
                return await context.Sdk.Users.GetNotificationsAsync(cancellationToken);
            case "template.getTemplates":
                return await context.Sdk.Templates.ListAsync(TemplatesOptionsFromQuery(kase.Query), cancellationToken);
            case "envelope.getEnvelopes":
                return await context.Sdk.Envelopes.ListAsync(EnvelopesOptionsFromQuery(kase.Query), cancellationToken);
            case "organization.getOrganization":
                return await context.Sdk.Organizations.GetAsync(context.SessionOrganizationId(), cancellationToken);
            case "member.getOrganizationMembers":
                return await context.Sdk.Members.ListAsync(cancellationToken);
            case "group.getGroups":
                return await context.Sdk.Groups.ListAsync(cancellationToken);
            case "organization.getEntitlements":
                return await context.Sdk.Organizations.GetEntitlementsAsync(cancellationToken);
            case "apiKey.getApiKeys":
                return await context.Sdk.ApiKeys.ListAsync(cancellationToken);
            case "brand.getBrands":
                return await context.Sdk.Brands.ListAsync(context.SessionOrganizationId(), cancellationToken);
            case "contact.getOrganizationContacts":
                return await context.Sdk.Contacts.ListAsync(cancellationToken);
            case "invitation.getOrganizationInvitations":
                return await context.Sdk.Invitations.ListAsync(cancellationToken);
            case "notification.getNotificationTemplates":
                return await context.Sdk.NotificationTemplates.ListAsync(cancellationToken);
            case "webhook.getWebhooks":
                return await context.Sdk.Webhooks.GetAsync(cancellationToken);
            case "organization.getOrganizationChildren":
                return await context.Sdk.Organizations.GetChildrenAsync(context.SessionOrganizationId(), cancellationToken);
            case "organization.getOrganizationPipelineSettings":
                return await context.Sdk.Organizations.GetPipelineSettingsAsync(context.SessionOrganizationId(), cancellationToken);
            case "organization.getOrganizationUsage":
                return await context.Sdk.Organizations.GetUsageAsync(context.SessionOrganizationId(), cancellationToken: cancellationToken);
            default:
                throw new InvalidOperationException($"Conformance case '{kase.Id}' has no SDK mapping; add one when the SDK grows the operation.");
        }
    }

    private static string BuildQuery(JsonObject? query)
    {
        if (query is null || query.Count == 0)
        {
            return string.Empty;
        }

        var pairs = query.Select(pair => $"{Uri.EscapeDataString(pair.Key)}={Uri.EscapeDataString(QueryValueText(pair.Value))}");
        return "?" + string.Join('&', pairs);
    }

    private static string QueryValueText(JsonNode? value)
    {
        if (value is JsonValue jsonValue && jsonValue.TryGetValue<string>(out var text))
        {
            return text;
        }

        return value?.ToJsonString() ?? "null";
    }

    private static GetTemplatesOptions TemplatesOptionsFromQuery(JsonObject? query)
    {
        if (query is null || query.Count == 0)
        {
            return new GetTemplatesOptions();
        }

        return new GetTemplatesOptions
        {
            Visibility = query["visibility"]?.GetValue<string>() switch
            {
                "private_shared" => TemplateVisibilityFilter.PrivateShared,
                "private" => TemplateVisibilityFilter.Private,
                "shared" => TemplateVisibilityFilter.Shared,
                "public" => TemplateVisibilityFilter.Public,
                _ => null,
            },
            Rows = query["rows"]?.GetValue<int?>(),
            Page = query["page"]?.GetValue<int?>(),
        };
    }

    private static ListEnvelopesOptions EnvelopesOptionsFromQuery(JsonObject? query)
    {
        if (query is null || query.Count == 0)
        {
            return new ListEnvelopesOptions();
        }

        return new ListEnvelopesOptions
        {
            TemplateId = query["template_id"]?.GetValue<string>(),
            Rows = query["rows"]?.GetValue<int?>(),
            Page = query["page"]?.GetValue<int?>(),
        };
    }

    /// <summary>Fills in $VERDOCS_* placeholders from a fixture request body, per the fixtures.json contract.</summary>
    private static JsonNode? SubstituteEnv(JsonNode? value, ConformanceSettings settings)
    {
        switch (value)
        {
            case JsonObject jsonObject:
            {
                var replaced = new JsonObject();
                foreach (var property in jsonObject)
                {
                    replaced[property.Key] = SubstituteEnv(property.Value, settings);
                }

                return replaced;
            }

            case JsonArray jsonArray:
            {
                var replaced = new JsonArray();
                foreach (var item in jsonArray)
                {
                    replaced.Add(SubstituteEnv(item, settings));
                }

                return replaced;
            }

            case JsonValue jsonValue when jsonValue.TryGetValue<string>(out var text) && text.StartsWith('$'):
                return text switch
                {
                    "$VERDOCS_TEST_EMAIL" => settings.Email,
                    "$VERDOCS_TEST_PASSWORD" => settings.Password,
                    _ => throw new InvalidOperationException($"No substitution for fixture placeholder {text}"),
                };

            default:
                return value?.DeepClone();
        }
    }
}
