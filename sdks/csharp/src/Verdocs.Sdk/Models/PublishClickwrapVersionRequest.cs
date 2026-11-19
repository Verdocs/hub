using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>The fields for <see cref="Resources.Clickwrap.PublishVersionAsync"/>.</summary>
public sealed record PublishClickwrapVersionRequest
{
    /// <summary>Whether everyone must accept this version again. Required, so it's never chosen by default.</summary>
    public required bool RequiresReacceptance { get; init; }

    /// <summary>What changed, kept with the version.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? ChangeSummary { get; init; }
}
