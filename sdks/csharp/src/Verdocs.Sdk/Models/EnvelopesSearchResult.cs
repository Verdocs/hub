using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// A legacy envelope search result page. No current operation returns this shape; the js-sdk
/// exports it without referencing it, and it is ported for API parity.
/// </summary>
public sealed record EnvelopesSearchResult
{
    /// <summary>The page number of this response.</summary>
    public int Page { get; init; }

    /// <summary>Total number of records matching the query.</summary>
    public int Total { get; init; }

    /// <summary>The envelopes found.</summary>
    public IReadOnlyList<Envelope> Result { get; init; } = [];

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
