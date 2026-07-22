using System.Globalization;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;

namespace Verdocs.Sdk.Tests.Conformance;

/// <summary>
/// The live lane's normalization: VolatileJson's volatile-key masking plus two adjustments the
/// raw-vs-SDK comparison needs when the SDK side is a re-serialized model rather than the raw
/// body itself.
///
/// Timestamps compare as instants, not renderings. A few timestamp columns dodge the volatile
/// pattern because their names do not end in _at or _exp (next_reminder, expiration_date,
/// first_used, ...). The SDK parses those into DateTimeOffset and System.Text.Json renders
/// them back differently than the server (".913Z" comes back as ".913+00:00", ".000Z" loses
/// its fraction entirely), so ISO-shaped strings on both sides are re-rendered canonically.
/// The Python lane canonicalizes the same way for the same reason.
///
/// Null-valued object members are dropped from both sides. System.Text.Json property binding
/// cannot distinguish a key sent as null from a key not sent at all, and the same model type
/// crosses the wire both ways within this lane: GET /v2/organizations/:id always includes
/// "parent" (null for top-level organizations) while the organization rows embedded in
/// profiles omit it, and GET /v2/users/me sends the full user row while the joined user
/// records on GET /v2/organization-members are a column subset. No per-property
/// WhenWritingNull layout can satisfy strict key equality for both shapes at once, so the
/// enforceable contract here compares presence-of-value rather than presence-of-key for
/// nulls. Everything else stays strict: names, types, non-null values, array order, and the
/// masked shape of volatile keys (their type markers are strings, never dropped). Exact
/// key-set fidelity against curated payloads remains enforced by ModelRoundTripTests.
/// </summary>
internal static partial class ConformanceJson
{
    /// <summary>Normalizes raw JSON text into the lane's canonical comparison string.</summary>
    internal static string NormalizeText(string json)
    {
        return Refine(VolatileJson.NormalizeText(json));
    }

    /// <summary>Normalizes a parsed node into the lane's canonical comparison string.</summary>
    internal static string Normalize(JsonNode? node)
    {
        return Refine(VolatileJson.Normalize(node));
    }

    /// <summary>Serializes a value with the SDK's own serializer options, then normalizes it.</summary>
    internal static string NormalizeValue<T>(T value)
    {
        return Refine(VolatileJson.NormalizeValue(value));
    }

    // Anchored to the full string so ordinary text never parses as a date; the same pattern
    // the Python lane uses.
    [GeneratedRegex(@"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$", RegexOptions.CultureInvariant)]
    private static partial Regex IsoTimestampPattern();

    // VolatileJson already masked volatile keys and sorted everything, so this pass only
    // drops null members and re-renders timestamps.
    private static string Refine(string canonicalJson)
    {
        return RefineNode(JsonNode.Parse(canonicalJson))?.ToJsonString() ?? "null";
    }

    private static JsonNode? RefineNode(JsonNode? node)
    {
        switch (node)
        {
            case JsonObject jsonObject:
            {
                var refined = new JsonObject();
                foreach (var property in jsonObject)
                {
                    if (property.Value is null)
                    {
                        continue;
                    }

                    refined[property.Key] = RefineNode(property.Value);
                }

                return refined;
            }

            case JsonArray jsonArray:
            {
                // Array items keep their positions, nulls included; only object members drop.
                var refined = new JsonArray();
                foreach (var item in jsonArray)
                {
                    refined.Add(RefineNode(item));
                }

                return refined;
            }

            case null:
                return null;

            default:
            {
                if (node.GetValueKind() == JsonValueKind.String)
                {
                    var text = node.GetValue<string>();
                    if (IsoTimestampPattern().IsMatch(text)
                        && DateTimeOffset.TryParse(text, CultureInfo.InvariantCulture, DateTimeStyles.None, out var timestamp))
                    {
                        return JsonValue.Create(timestamp.ToString("O", CultureInfo.InvariantCulture));
                    }
                }

                return node.DeepClone();
            }
        }
    }
}
