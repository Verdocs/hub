using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// Body for Templates.CreateAsync. Roles may be created inline via <see cref="Roles"/>.
/// Fields cannot: the server validates a create-time fields array but discards it, so add
/// fields after creation through <see cref="Resources.TemplateFields.CreateAsync"/>. Text tags
/// ({{...}}) inside uploaded documents create roles and fields automatically when the
/// organization's pipeline settings allow.
/// </summary>
public sealed record CreateTemplateRequest
{
    /// <summary>Name for the new template.</summary>
    public required string Name { get; init; }

    /// <summary>Optional description to help identify the template.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Description { get; init; }

    /// <summary>Visibility level; see <see cref="TemplateVisibility"/>. The server defaults to private.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Visibility { get; init; }

    /// <summary>Who owns envelopes created from the template; see <see cref="TemplateSender"/>.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Sender { get; init; }

    /// <summary>
    /// Delay in milliseconds before the first reminder is sent (min 1 day, max 30 days). The
    /// js-sdk doc comments say seconds; the server validates milliseconds. Null disables
    /// reminders and carries that meaning on the wire, so this field is always serialized
    /// rather than omitted when unset.
    /// </summary>
    public long? InitialReminder { get; init; }

    /// <summary>
    /// Delay in milliseconds between follow-up reminders (min 1 day, max 30 days). The js-sdk
    /// doc comments say seconds; the server validates milliseconds. Null disables follow-ups
    /// and carries that meaning on the wire, so this field is always serialized rather than
    /// omitted when unset.
    /// </summary>
    public long? FollowupReminders { get; init; }

    /// <summary>Maximum number of days after envelope creation reminders are sent (1-90). The server defaults to 14.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public int? MaxReminderDays { get; init; }

    /// <summary>
    /// Documents to attach by URI or Base64 data. Only the JSON path sends these; the
    /// multipart overload carries local files as file parts instead.
    /// </summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyList<TemplateDocumentSource>? Documents { get; init; }

    /// <summary>
    /// Roles to create inline. Only the JSON path can send roles; multipart text parts carry
    /// strings only, so the multipart overload rejects a request that sets them.
    /// </summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyList<CreateRoleRequest>? Roles { get; init; }
}
