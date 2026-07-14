using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>One page of results from a template search.</summary>
public sealed record TemplateSearchResult
{
    /// <summary>The page number of this response.</summary>
    public int Page { get; init; }

    /// <summary>The number of rows requested per page.</summary>
    public int Row { get; init; }

    /// <summary>Total number of records matching the query, for pagination.</summary>
    public long Total { get; init; }

    /// <summary>The templates found.</summary>
    public IReadOnlyList<Template> Result { get; init; } = [];

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
