using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;

namespace Verdocs.Sdk.Tests;

/// <summary>
/// Mirrors packages/conformance/src/support.ts: values under volatile keys (timestamps,
/// tokens, expiries) are replaced with type markers so two calls made seconds apart still
/// compare equal, while the shape is fully checked. Output is canonical (keys sorted, one
/// writer for both sides) so normalized strings can be compared directly.
/// </summary>
public static partial class VolatileJson
{
    /// <summary>Normalizes raw JSON text into a canonical, volatile-masked string.</summary>
    public static string NormalizeText(string json)
    {
        return NormalizeText(json, DefaultVolatileKeyPattern());
    }

    /// <summary>Normalizes raw JSON text using the supplied volatile-key pattern.</summary>
    public static string NormalizeText(string json, Regex volatileKeyPattern)
    {
        return Canonical(NormalizeNode(JsonNode.Parse(json), volatileKeyPattern));
    }

    /// <summary>Normalizes a parsed node into a canonical, volatile-masked string.</summary>
    public static string Normalize(JsonNode? node)
    {
        return Normalize(node, DefaultVolatileKeyPattern());
    }

    /// <summary>Normalizes a parsed node using the supplied volatile-key pattern.</summary>
    public static string Normalize(JsonNode? node, Regex volatileKeyPattern)
    {
        return Canonical(NormalizeNode(node, volatileKeyPattern));
    }

    /// <summary>Serializes a value with the SDK's own serializer options, then normalizes it.</summary>
    public static string NormalizeValue<T>(T value)
    {
        return NormalizeValue(value, DefaultVolatileKeyPattern());
    }

    /// <summary>Serializes a value, then normalizes it with the supplied volatile-key pattern.</summary>
    public static string NormalizeValue<T>(T value, Regex volatileKeyPattern)
    {
        // Serialize by the runtime type, not T, so a caller can hand us a value typed as object
        // (the conformance dispatch returns different SDK models) and still get every property.
        return NormalizeText(JsonSerializer.Serialize(value, value?.GetType() ?? typeof(T), VerdocsJson.Options), volatileKeyPattern);
    }

    // Unit tests use this built-in default. The live conformance lane compiles the pattern from
    // packages/conformance/fixtures.json instead (see ConformanceFixtures.VolatileKeyPattern).
    [GeneratedRegex("(_at|_exp)$|^(access_token|id_token|refresh_token|expires_in|last_polled)", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex DefaultVolatileKeyPattern();

    private static string Canonical(JsonNode? node)
    {
        return node?.ToJsonString() ?? "null";
    }

    private static JsonNode? NormalizeNode(JsonNode? node, Regex volatileKeyPattern)
    {
        switch (node)
        {
            case JsonObject jsonObject:
            {
                var normalized = new JsonObject();
                foreach (var property in jsonObject.OrderBy(entry => entry.Key, StringComparer.Ordinal))
                {
                    normalized[property.Key] = volatileKeyPattern.IsMatch(property.Key)
                        ? JsonValue.Create(TypeMarker(property.Value))
                        : NormalizeNode(property.Value, volatileKeyPattern);
                }

                return normalized;
            }

            case JsonArray jsonArray:
            {
                var normalized = new JsonArray();
                foreach (var item in jsonArray)
                {
                    normalized.Add(NormalizeNode(item, volatileKeyPattern));
                }

                return normalized;
            }

            case null:
                return null;

            default:
                return node.DeepClone();
        }
    }

    private static string TypeMarker(JsonNode? value)
    {
        if (value is null)
        {
            return "<<null>>";
        }

        return value.GetValueKind() switch
        {
            JsonValueKind.String => "<<string>>",
            JsonValueKind.Number => "<<number>>",
            JsonValueKind.True or JsonValueKind.False => "<<boolean>>",
            JsonValueKind.Null => "<<null>>",
            // JS typeof reports both arrays and objects as "object" and the markers follow typeof.
            _ => "<<object>>",
        };
    }
}
