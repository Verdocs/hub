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
        return Canonical(NormalizeNode(JsonNode.Parse(json)));
    }

    /// <summary>Normalizes a parsed node into a canonical, volatile-masked string.</summary>
    public static string Normalize(JsonNode? node)
    {
        return Canonical(NormalizeNode(node));
    }

    /// <summary>Serializes a value with the SDK's own serializer options, then normalizes it.</summary>
    public static string NormalizeValue<T>(T value)
    {
        return NormalizeText(JsonSerializer.Serialize(value, VerdocsJson.Options));
    }

    // The same pattern and flags as support.ts, so every SDK lane masks the same keys.
    [GeneratedRegex("(_at|_exp)$|^(access_token|id_token|refresh_token|expires_in|last_polled)", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex VolatileKeyPattern();

    private static string Canonical(JsonNode? node)
    {
        return node?.ToJsonString() ?? "null";
    }

    private static JsonNode? NormalizeNode(JsonNode? node)
    {
        switch (node)
        {
            case JsonObject jsonObject:
            {
                var normalized = new JsonObject();
                foreach (var property in jsonObject.OrderBy(entry => entry.Key, StringComparer.Ordinal))
                {
                    normalized[property.Key] = VolatileKeyPattern().IsMatch(property.Key)
                        ? JsonValue.Create(TypeMarker(property.Value))
                        : NormalizeNode(property.Value);
                }

                return normalized;
            }

            case JsonArray jsonArray:
            {
                var normalized = new JsonArray();
                foreach (var item in jsonArray)
                {
                    normalized.Add(NormalizeNode(item));
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
