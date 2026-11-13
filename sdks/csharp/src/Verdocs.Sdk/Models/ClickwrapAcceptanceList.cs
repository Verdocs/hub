using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>One page of records, newest first.</summary>
public sealed record ClickwrapAcceptanceList
{
    /// <summary>The total number of matching records.</summary>
    public int Count { get; init; }

    /// <summary>The page size used.</summary>
    public int Rows { get; init; }

    /// <summary>The page returned.</summary>
    public int Page { get; init; }

    /// <summary>The records on this page.</summary>
    public IReadOnlyList<ClickwrapAcceptanceSummary> Acceptances { get; init; } = [];

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
