using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>The fields for <see cref="Resources.Clickwrap.SendEventAsync"/>.</summary>
public sealed record SendClickwrapEventRequest
{
    /// <summary>What happened: shown, scrolled_to_end, checked, or unchecked; see <see cref="ClickwrapEventType"/>.</summary>
    public required string Event { get; init; }

    /// <summary>The checkbox's version ID, for checked and unchecked only.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? VersionId { get; init; }

    /// <summary>The browser's clock when it happened. Kept for reference.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public DateTimeOffset? ClientAt { get; init; }
}
