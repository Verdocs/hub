using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>One page of results from <see cref="VerdocsEndpoint.GetTemplatesAsync"/>.</summary>
public sealed record TemplateList
{
    /// <summary>Total number of records matching the query, for pagination.</summary>
    public long Count { get; init; }

    /// <summary>Number of rows requested per page.</summary>
    public int Rows { get; init; }

    /// <summary>The page number of this response (0-based).</summary>
    public int Page { get; init; }

    /// <summary>The templates found.</summary>
    public IReadOnlyList<Template> Templates { get; init; } = [];

    /// <summary>Wire fields this seed model does not cover yet, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
