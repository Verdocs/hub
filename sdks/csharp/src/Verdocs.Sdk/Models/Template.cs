using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// A reusable definition for a signing flow, including attachments, fields, and recipients.
/// Templates are used to create envelopes. The list endpoint returns template summaries;
/// <see cref="Resources.Templates.GetAsync"/> also includes <see cref="Roles"/>,
/// <see cref="Documents"/>, and <see cref="Fields"/>.
/// </summary>
public sealed record Template
{
    /// <summary>The unique ID of the template.</summary>
    public string Id { get; init; } = null!;

    /// <summary>The template's owner/creator profile ID.</summary>
    public string ProfileId { get; init; } = null!;

    /// <summary>Organization the template lives in.</summary>
    public string OrganizationId { get; init; } = null!;

    /// <summary>Who owns envelopes created from the template; see <see cref="TemplateSender"/>. "template_owner" only matters for shared or public templates.</summary>
    public string Sender { get; init; } = null!;

    /// <summary>The user-supplied name of the template.</summary>
    public string Name { get; init; } = null!;

    /// <summary>Optional description to help identify the template.</summary>
    public string? Description { get; init; }

    /// <summary>Visibility level; see <see cref="TemplateVisibility"/> for known values.</summary>
    public string? Visibility { get; init; }

    /// <summary>Delay in milliseconds before the first reminder is sent (the js-sdk doc comments say seconds but the handler stores and compares ms). Null or zero disables reminders.</summary>
    public long? InitialReminder { get; init; }

    /// <summary>Delay in milliseconds before subsequent reminders are sent (ms for the same reason as InitialReminder). Null or zero disables follow-ups.</summary>
    public long? FollowupReminders { get; init; }

    /// <summary>Maximum number of days after envelope creation for which reminders are sent.</summary>
    public int MaxReminderDays { get; init; }

    /// <summary>Number of times the template has been used.</summary>
    public long Counter { get; init; }

    /// <summary>Number of times the template has been starred.</summary>
    public long StarCounter { get; init; }

    /// <summary>Deprecated visibility flag; see <see cref="Visibility"/>.</summary>
    public bool IsPersonal { get; init; }

    /// <summary>Deprecated visibility flag; see <see cref="Visibility"/>.</summary>
    public bool IsPublic { get; init; }

    /// <summary>True when the template has at least one signer and every signer has at least one field.</summary>
    public bool IsSendable { get; init; }

    /// <summary>Creation date and time.</summary>
    public DateTimeOffset CreatedAt { get; init; }

    /// <summary>Last-update date and time.</summary>
    public DateTimeOffset UpdatedAt { get; init; }

    /// <summary>When the template was last used to create an envelope, if ever.</summary>
    public DateTimeOffset? LastUsedAt { get; init; }

    /// <summary>Server-side search string. The js-sdk declares it required, but the API omits it from template responses.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? SearchKey { get; init; }

    /// <summary>Arbitrary storage for integrators, for example source record IDs.</summary>
    public JsonElement? Data { get; init; }

    /// <summary>Tags attached to the template.</summary>
    public IReadOnlyList<string>? Tags { get; init; }

    /// <summary>The owner's profile, when the API includes it.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public Profile? Profile { get; init; }

    /// <summary>The owning organization, when the API includes it.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public Organization? Organization { get; init; }

    /// <summary>Recipient placeholders, included by the template detail endpoint.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyList<Role>? Roles { get; init; }

    /// <summary>Attached documents, included by the template detail endpoint.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyList<TemplateDocument>? Documents { get; init; }

    /// <summary>Signing fields, included by the template detail endpoint.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyList<TemplateField>? Fields { get; init; }

    /// <summary>Deprecated alias for <see cref="Documents"/>.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyList<TemplateDocument>? TemplateDocuments { get; init; }

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
