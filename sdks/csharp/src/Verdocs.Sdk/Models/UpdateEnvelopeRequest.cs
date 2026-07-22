using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// Fields changeable via <see cref="Resources.Envelopes.UpdateAsync"/>. Only set properties are
/// sent, so an unset property leaves the envelope's current value alone.
/// </summary>
public sealed record UpdateEnvelopeRequest
{
    /// <summary>New name for the envelope.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Name { get; init; }

    /// <summary>New sender name for the envelope.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? SenderName { get; init; }

    /// <summary>New sender email for the envelope.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? SenderEmail { get; init; }

    /// <summary>Change the initial-reminder delay, in milliseconds.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public long? InitialReminder { get; init; }

    /// <summary>Change the follow-up reminder delay, in milliseconds.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public long? FollowupReminders { get; init; }

    /// <summary>When the envelope automatically expires (is canceled). Must be at least one day in the future.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public DateTimeOffset? ExpiresAt { get; init; }

    /// <summary>Change the envelope's visibility: "private" or "shared".</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Visibility { get; init; }

    /// <summary>If true, no email or SMS messages are sent to any recipient.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public bool? NoContact { get; init; }

    /// <summary>Replace the developer-supplied metadata attached to the envelope.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public object? Data { get; init; }
}
