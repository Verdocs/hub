using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// A reusable definition for a signing flow, including attachments, fields, and recipients.
/// Templates are used to create envelopes. The list endpoint returns template summaries;
/// <see cref="VerdocsEndpoint.GetTemplateAsync"/> also includes <see cref="Roles"/>,
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

    /// <summary>Who owns envelopes created from the template: "envelope_creator" or "template_owner".</summary>
    public string Sender { get; init; } = null!;

    /// <summary>The user-supplied name of the template.</summary>
    public string Name { get; init; } = null!;

    /// <summary>Optional description to help identify the template.</summary>
    public string? Description { get; init; }

    /// <summary>Visibility level: "private", "shared", or "public".</summary>
    public string? Visibility { get; init; }

    /// <summary>Delay in seconds before the first reminder is sent. Null or zero disables reminders.</summary>
    public long? InitialReminder { get; init; }

    /// <summary>Delay in seconds before subsequent reminders are sent. Null or zero disables follow-ups.</summary>
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

    /// <summary>Arbitrary storage for integrators, for example source record IDs.</summary>
    public JsonElement? Data { get; init; }

    /// <summary>Tags attached to the template.</summary>
    public IReadOnlyList<string>? Tags { get; init; }

    /// <summary>Recipient placeholders, included by the template detail endpoint.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyList<Role>? Roles { get; init; }

    /// <summary>Attached documents, included by the template detail endpoint.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyList<TemplateDocument>? Documents { get; init; }

    /// <summary>Signing fields, included by the template detail endpoint.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyList<TemplateField>? Fields { get; init; }

    /// <summary>Wire fields this seed model does not cover yet, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
