using System.Text.Json.Nodes;
using Xunit;

namespace Verdocs.Sdk.Tests.Conformance;

/// <summary>
/// Reads the shared packages/conformance/fixtures.json contract that also drives the TS and
/// pytest lanes. Only the "cases" array feeds the theory in ConformanceTests: "frozen" cases are
/// parked (fixtures.json documents why) and every lane leaves them out entirely, and "chain" is
/// ChainTests's ordered lifecycle rather than an independent-case list.
/// </summary>
public static class ConformanceFixtures
{
    private static readonly Lazy<IReadOnlyList<ConformanceCase>> Loaded = new(Load);

    /// <summary>Every case in fixtures.json's "cases" array, in file order.</summary>
    public static IReadOnlyList<ConformanceCase> Cases => Loaded.Value;

    /// <summary>MemberData source for ConformanceTests's theory: one row per fixture case.</summary>
    public static TheoryData<ConformanceCase> CaseData()
    {
        var data = new TheoryData<ConformanceCase>();
        foreach (var kase in Cases)
        {
            data.Add(kase);
        }

        return data;
    }

    private static IReadOnlyList<ConformanceCase> Load()
    {
        var path = FindFixturesPath()
            ?? throw new InvalidOperationException(
                "Could not find packages/conformance/fixtures.json above the test binary.");

        var root = JsonNode.Parse(File.ReadAllText(path))!.AsObject();
        var cases = root["cases"]!.AsArray();

        return cases
            .Select(node =>
            {
                var obj = node!.AsObject();
                return new ConformanceCase(
                    Id: obj["id"]!.GetValue<string>(),
                    Sdk: obj["sdk"]!.GetValue<string>(),
                    Method: obj["method"]!.GetValue<string>(),
                    Path: obj["path"]!.GetValue<string>(),
                    Auth: obj["auth"]!.GetValue<bool>(),
                    Query: obj["query"]?.AsObject(),
                    Body: obj["body"]?.AsObject(),
                    Note: obj["note"]?.GetValue<string>());
            })
            .ToList();
    }

    // The test binary's output directory nests under bin/<config>/<tfm>, so a fixed parent
    // count would break the moment the TFM changes; walk up looking for the file instead, the
    // same approach ConformanceEnv uses to find the nearest .env.
    private static string? FindFixturesPath()
    {
        for (var directory = new DirectoryInfo(AppContext.BaseDirectory); directory is not null; directory = directory.Parent)
        {
            var candidate = Path.Combine(directory.FullName, "packages", "conformance", "fixtures.json");
            if (File.Exists(candidate))
            {
                return candidate;
            }
        }

        return null;
    }
}
