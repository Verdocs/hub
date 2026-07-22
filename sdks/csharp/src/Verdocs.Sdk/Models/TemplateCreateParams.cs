using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// Fields for creating a template via POST /v2/templates. Only <see cref="Name"/> is required.
/// This seed covers the JSON-safe subset of the js-sdk create params; document uploads, roles,
/// and fields come later.
/// </summary>
public sealed record TemplateCreateParams
{
    /// <summary>The template name.</summary>
    public required string Name { get; init; }

    /// <summary>Optional description to help identify the template.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Description { get; init; }

    /// <summary>Visibility level: "private", "shared", or "public".</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Visibility { get; init; }

    /// <summary>Who owns envelopes created from the template: "envelope_creator" or "template_owner".</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Sender { get; init; }

    /// <summary>Delay in seconds before the first reminder is sent (minimum four hours).</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public long? InitialReminder { get; init; }

    /// <summary>Delay in seconds before subsequent reminders are sent (minimum twelve hours).</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public long? FollowupReminders { get; init; }

    /// <summary>Maximum number of days after envelope creation for which reminders are sent.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public int? MaxReminderDays { get; init; }
}
