using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// Legacy envelope search options. No current operation accepts this shape; the js-sdk exports
/// it without referencing it, and it is ported for API parity.
/// </summary>
public sealed record DocumentSearchOptions
{
    /// <summary>Number of rows to retrieve.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public int? Rows { get; init; }

    /// <summary>Page to retrieve (0-based).</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public int? Page { get; init; }

    /// <summary>Sort order: "updated_at" or "created_at".</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? SortBy { get; init; }

    /// <summary>Overrides the sort direction.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public bool? Ascending { get; init; }

    /// <summary>Match envelopes the caller owns.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public bool? IsOwner { get; init; }

    /// <summary>Match envelopes where the caller is a recipient.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public bool? IsRecipient { get; init; }

    /// <summary>Match envelopes in one of these states; see <see cref="Models.EnvelopeStatus"/> for known values.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyList<string>? EnvelopeStatus { get; init; }

    /// <summary>Match envelopes with a recipient in one of these states; see <see cref="Models.RecipientStatus"/> for known values.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyList<string>? RecipientStatus { get; init; }
}
