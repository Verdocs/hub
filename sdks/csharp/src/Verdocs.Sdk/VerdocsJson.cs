using System.Text.Json;

namespace Verdocs;

/// <summary>
/// The single shared serializer configuration for the SDK (docs/standards/csharp.md rule 11).
/// When source generation lands, the JsonSerializerContext slots in here.
/// </summary>
internal static class VerdocsJson
{
    /// <summary>Options used for every request body, response body, and token payload.</summary>
    internal static JsonSerializerOptions Options { get; } = new()
    {
        // The wire format is snake_case; the policy applies both ways so models stay
        // attribute-free except for names the policy cannot derive (rule 13).
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
    };
}
