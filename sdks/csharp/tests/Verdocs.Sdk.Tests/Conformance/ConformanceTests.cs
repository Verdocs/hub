using System.Net;
using System.Text.Json.Nodes;
using Verdocs.Models;
using Xunit;

namespace Verdocs.Sdk.Tests.Conformance;

/// <summary>
/// The shared conformance lane defined by packages/conformance/fixtures.json: every case is run
/// against live beta, once with a raw HttpClient and once with the SDK, then status and
/// volatile-normalized JSON are compared deeply. Cases come from that file, not a local copy, so
/// this lane stays in lockstep with the other SDKs. Frozen cases (the star toggle) live only in
/// the fixture and never reach here. Skipped unless VERDOCS_CONFORMANCE=1 so the default dotnet
/// test run stays offline; credentials come from the environment or hub/.env.
/// </summary>
public sealed class ConformanceTests
{
    private static readonly Lazy<Task<ConformanceContext>> SharedContext = new(ConformanceContext.CreateAsync);

    public static TheoryData<string> Cases()
    {
        var data = new TheoryData<string>();
        foreach (var id in ConformanceFixtures.CaseIds)
        {
            data.Add(id);
        }

        return data;
    }

    [Theory]
    [MemberData(nameof(Cases))]
    public async Task Case_MatchesRawHttp(string caseId)
    {
        var context = await GetContextAsync();
        var fixtureCase = ConformanceFixtures.GetCase(caseId);

        var method = new HttpMethod(fixtureCase["method"]!.GetValue<string>());
        var auth = fixtureCase["auth"]?.GetValue<bool>() ?? false;
        var (status, rawBody) = await context.RawAsync(method, BuildPath(fixtureCase), auth, BuildBody(fixtureCase, context.Settings));
        Assert.Equal(HttpStatusCode.OK, status);

        var viaSdk = await DispatchAsync(context, fixtureCase);
        Assert.NotNull(viaSdk);

        var expected = VolatileJson.Normalize(SelectReference(caseId, rawBody));
        Assert.Equal(expected, VolatileJson.NormalizeValue(viaSdk));
    }

    private static string BuildPath(JsonObject fixtureCase)
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

    private static JsonNode? BuildBody(JsonObject fixtureCase, ConformanceSettings settings)
    {
        if (fixtureCase["body"] is not JsonObject body)
        {
            return null;
        }

        var result = new JsonObject();
        foreach (var entry in body)
        {
            result[entry.Key] = JsonValue.Create(Substitute(entry.Value?.ToString() ?? string.Empty, settings));
        }

        return result;
    }

    private static string Substitute(string value, ConformanceSettings settings)
    {
        return value switch
        {
            "$VERDOCS_TEST_EMAIL" => settings.Email,
            "$VERDOCS_TEST_PASSWORD" => settings.Password,
            _ when value.StartsWith('$') => throw new InvalidOperationException($"No substitution for fixture placeholder {value}."),
            _ => value,
        };
    }

    private static async Task<object?> DispatchAsync(ConformanceContext context, JsonObject fixtureCase)
    {
        var sdk = fixtureCase["sdk"]!.GetValue<string>();
        switch (sdk)
        {
            case "authenticate":
                // A fresh endpoint proves authenticate needs no existing session.
                using (var fresh = new VerdocsEndpoint(new VerdocsEndpointOptions { BaseUrl = context.Settings.ApiBase }))
                {
                    return await fresh.AuthenticateAsync(
                        new AuthenticateRequest
                        {
                            Username = context.Settings.Email,
                            Password = context.Settings.Password,
                        },
                        TestContext.Current.CancellationToken);
                }

            case "getMyUser":
                return await context.Sdk.GetMyUserAsync(TestContext.Current.CancellationToken);

            case "getCurrentProfile":
                return await context.Sdk.GetCurrentProfileAsync(TestContext.Current.CancellationToken);

            case "getTemplates":
                return await context.Sdk.GetTemplatesAsync(BuildTemplatesOptions(fixtureCase), TestContext.Current.CancellationToken);

            default:
                throw new InvalidOperationException(
                    $"Conformance case '{fixtureCase["id"]!.GetValue<string>()}' has no SDK mapping for '{sdk}'. Add one when the SDK grows the operation.");
        }
    }

    private static GetTemplatesOptions BuildTemplatesOptions(JsonObject fixtureCase)
    {
        if (fixtureCase["query"] is not JsonObject query)
        {
            return new GetTemplatesOptions();
        }

        return new GetTemplatesOptions
        {
            Q = query["q"]?.GetValue<string>(),
            Visibility = query["visibility"] is { } visibility ? ParseVisibility(visibility.GetValue<string>()) : null,
            Rows = query["rows"]?.GetValue<int>(),
            Page = query["page"]?.GetValue<int>(),
        };
    }

    private static TemplateVisibilityFilter ParseVisibility(string value)
    {
        return value switch
        {
            "private_shared" => TemplateVisibilityFilter.PrivateShared,
            "private" => TemplateVisibilityFilter.Private,
            "shared" => TemplateVisibilityFilter.Shared,
            "public" => TemplateVisibilityFilter.Public,
            _ => throw new InvalidOperationException($"Unknown template visibility '{value}' in fixtures.json."),
        };
    }

    private static JsonNode? SelectReference(string caseId, string rawBody)
    {
        var node = JsonNode.Parse(rawBody);
        if (caseId != "profiles-current")
        {
            return node;
        }

        // The raw response is an array; the SDK returns the entry with current=true, so that
        // entry is the comparison target (fixtures.json, profiles-current note).
        var profiles = Assert.IsType<JsonArray>(node);
        var current = profiles.FirstOrDefault(entry => entry?["current"]?.GetValue<bool>() == true);
        Assert.NotNull(current);
        return current;
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
