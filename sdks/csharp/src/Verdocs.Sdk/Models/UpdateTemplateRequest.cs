using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// Body for Templates.UpdateAsync. Reminder settings are rewritten on every update (see the
/// reminder property notes), so an update cannot leave them untouched: read the template
/// first and resend any values you want to keep.
/// </summary>
public sealed record UpdateTemplateRequest
{
    /// <summary>New name for the template.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Name { get; init; }

    /// <summary>New description for the template.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Description { get; init; }

    /// <summary>New visibility level; see <see cref="TemplateVisibility"/>.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Visibility { get; init; }

    /// <summary>Who owns envelopes created from the template; see <see cref="TemplateSender"/>.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Sender { get; init; }

    /// <summary>
    /// Delay in milliseconds before the first reminder is sent (min 1 day, max 30 days). The
    /// js-sdk doc comments say seconds; the server validates milliseconds. Null disables
    /// reminders and carries that meaning on the wire, so this field is always serialized;
    /// the server clears both reminder fields whenever it arrives null or absent.
    /// </summary>
    public long? InitialReminder { get; init; }

    /// <summary>
    /// Delay in milliseconds between follow-up reminders (min 1 day, max 30 days). The js-sdk
    /// doc comments say seconds; the server validates milliseconds. Null disables follow-ups
    /// and is always serialized. The server also clears this whenever
    /// <see cref="InitialReminder"/> is null or absent.
    /// </summary>
    public long? FollowupReminders { get; init; }

    /// <summary>
    /// Maximum number of days reminders are sent for (1-90). The server defaults an omitted
    /// value to 14 on every update, so leaving this unset resets it rather than preserving
    /// the stored value.
    /// </summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public int? MaxReminderDays { get; init; }
}
