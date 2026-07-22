using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// Parameters for <see cref="Resources.Envelopes.CreateAsync"/>. The js-sdk splits this into
/// template and direct variants (ICreateEnvelopeFromTemplateRequest and
/// ICreateEnvelopeDirectlyRequest); C# has no union types, so one record covers both. Set
/// <see cref="TemplateId"/> to build the envelope from a template (the server then ignores
/// <see cref="Documents"/>); leave it null and supply <see cref="Name"/> and
/// <see cref="Documents"/> to create the envelope directly.
/// </summary>
public sealed record CreateEnvelopeRequest
{
    /// <summary>The template to copy. When set, every template role must have a matching entry in <see cref="Recipients"/> by role name.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? TemplateId { get; init; }

    /// <summary>Name for the envelope. The server requires this when <see cref="TemplateId"/> is null and defaults it to the template name otherwise.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Name { get; init; }

    /// <summary>Description for the envelope.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Description { get; init; }

    /// <summary>Overrides the sender name shown in email and other notifications. Only the name can change; the from address stays notifications@verdocs.com so spam filters keep trusting the mail.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? SenderName { get; init; }

    /// <summary>Overrides the sender email shown in the Web UI and certificate. It cannot change the address notifications are sent from.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? SenderEmail { get; init; }

    /// <summary>If true, no email or SMS messages are sent to any recipient.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public bool? NoContact { get; init; }

    /// <summary>When the envelope automatically expires (is canceled). Must be more than 24 hours out. The server only stores this on the no-template path today.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public DateTimeOffset? ExpiresAt { get; init; }

    /// <summary>Environment to execute the envelope in. Leave unset unless instructed by Verdocs support.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Environment { get; init; }

    /// <summary>"private" or, to make the envelope visible to others in the organization, "shared". The server defaults to "private".</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Visibility { get; init; }

    /// <summary>Delay in milliseconds before the first reminder, 0 to 30 days; 0 disables reminders. The js-sdk doc comments say seconds, but the server validates milliseconds. Optional on the server even though the js-sdk's direct-create type requires it.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public long? InitialReminder { get; init; }

    /// <summary>Delay in milliseconds before follow-up reminders, 0 to 30 days; 0 disables them. Milliseconds, not the seconds the js-sdk docs describe.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public long? FollowupReminders { get; init; }

    /// <summary>Maximum number of days after creation for which reminders are sent (1 to 90). The server defaults to 14.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public int? MaxReminderDays { get; init; }

    /// <summary>Arbitrary metadata stored with the envelope for the caller's own tracking. Not shown to recipients, but not private either, so keep sensitive data out.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public object? Data { get; init; }

    /// <summary>The recipients in the signing workflow.</summary>
    public required IReadOnlyList<CreateEnvelopeRecipient> Recipients { get; init; }

    /// <summary>Documents to attach. The server requires at least one when <see cref="TemplateId"/> is null and ignores the list entirely when it is set.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyList<CreateEnvelopeDocument>? Documents { get; init; }

    /// <summary>Fields to create (direct path) or prepared-field overrides matched by name (template path). An array on both paths; the js-sdk's template-request type declares a single object here, which is a typo.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyList<CreateEnvelopeField>? Fields { get; init; }

    /// <summary>The long-form timezone, for example "America/Phoenix".</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Timezone { get; init; }

    /// <summary>The locale code, for example "en-US".</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Locale { get; init; }
}
