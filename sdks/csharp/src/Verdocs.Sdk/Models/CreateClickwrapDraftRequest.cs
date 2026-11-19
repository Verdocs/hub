using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>The fields for <see cref="Resources.Clickwrap.CreateDraftAsync"/>. Set Content, CopyCurrent, or neither for an empty draft, not both.</summary>
public sealed record CreateClickwrapDraftRequest
{
    /// <summary>The agreement text as HTML. Only headings, paragraphs, lists, links, bold, italic, underline, and line breaks are kept.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Content { get; init; }

    /// <summary>Start from the current version's text instead.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public bool? CopyCurrent { get; init; }
}
