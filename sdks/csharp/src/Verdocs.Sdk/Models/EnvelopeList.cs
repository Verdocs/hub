using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>One page of results from <see cref="Resources.Envelopes.ListAsync"/>.</summary>
public sealed record EnvelopeList
{
    /// <summary>Total number of records matching the query, for pagination.</summary>
    public long Count { get; init; }

    /// <summary>Number of rows returned in this response page.</summary>
    public int Rows { get; init; }

    /// <summary>The page number of this response (0-based).</summary>
    public int Page { get; init; }

    /// <summary>The envelopes found.</summary>
    public IReadOnlyList<Envelope> Envelopes { get; init; } = [];

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
