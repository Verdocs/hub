using System.Text.Json.Nodes;

namespace Verdocs.Sdk.Tests.Conformance;

/// <summary>
/// Loads the shared cases from packages/conformance/fixtures.json so this lane runs the same
/// contract as every other SDK from one file, never a local copy. The file is found by walking
/// up from the test binary, the same way ConformanceEnv finds the hub root .env.
/// </summary>
internal static class ConformanceFixtures
{
    private static readonly Lazy<IReadOnlyList<JsonObject>> CasesValue = new(LoadCases);

    /// <summary>The ids of every active case, in file order. Entries under "frozen" are excluded.</summary>
    internal static IEnumerable<string> CaseIds => CasesValue.Value.Select(entry => entry["id"]!.GetValue<string>());

    internal static JsonObject GetCase(string id)
    {
        return CasesValue.Value.FirstOrDefault(entry => entry["id"]!.GetValue<string>() == id)
            ?? throw new InvalidOperationException($"No conformance case with id '{id}' in fixtures.json.");
    }

    private static IReadOnlyList<JsonObject> LoadCases()
    {
        var path = Locate();
        var root = JsonNode.Parse(File.ReadAllText(path))?.AsObject()
            ?? throw new InvalidOperationException($"fixtures.json at {path} did not parse to an object.");
        var cases = root["cases"]?.AsArray()
            ?? throw new InvalidOperationException("fixtures.json has no \"cases\" array.");

        return cases.Select(node => node!.AsObject()).ToList();
    }

    private static string Locate()
    {
        for (var directory = new DirectoryInfo(AppContext.BaseDirectory); directory is not null; directory = directory.Parent)
        {
            var candidate = Path.Combine(directory.FullName, "packages", "conformance", "fixtures.json");
            if (File.Exists(candidate))
            {
                return candidate;
            }
        }

        throw new FileNotFoundException(
            "Could not find packages/conformance/fixtures.json above the test binary; the conformance lane loads its cases from that shared file.");
    }
}
