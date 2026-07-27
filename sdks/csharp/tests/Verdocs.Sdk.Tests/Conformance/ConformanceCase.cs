using System.Text.Json.Nodes;

namespace Verdocs.Sdk.Tests.Conformance;

/// <summary>
/// One entry from fixtures.json's "cases" array, the contract this lane shares with the TS and
/// pytest lanes. "Sdk" is an @sdkOperation id (docs/sdk-docs-generation.md), e.g.
/// "template.getTemplates", not a bare method name: the same cross-language key the SDK
/// reference docs use, so a case here and a tagged method anywhere refer to the same operation.
/// </summary>
/// <param name="Id">Stable test name, used as the theory row's display name.</param>
/// <param name="Sdk">The @sdkOperation id CallSdkForCaseAsync dispatches on.</param>
/// <param name="Method">The raw HTTP method.</param>
/// <param name="Path">The raw HTTP path, possibly carrying the $SESSION.organization_id placeholder.</param>
/// <param name="Auth">Whether the raw call sends the session bearer token.</param>
/// <param name="Query">Optional query params; the raw side serializes them onto the URL.</param>
/// <param name="Body">Optional JSON body; $VERDOCS_* placeholders are substituted before sending.</param>
/// <param name="Note">Human and machine hint for a special compare; see Special cases in the plan doc.</param>
public sealed record ConformanceCase(
    string Id,
    string Sdk,
    string Method,
    string Path,
    bool Auth,
    JsonObject? Query,
    JsonObject? Body,
    string? Note)
{
    // xunit's default display name for a record argument is its full ToString(), which would
    // otherwise print every property; the case id alone is what the other lanes show too.
    public override string ToString() => Id;
}
