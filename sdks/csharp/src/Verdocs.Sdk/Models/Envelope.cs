using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// A workflow wrapper that shepherds one or more documents through the recipients in a signing
/// process. Note that "complete" status means all required data was submitted and workflow
/// steps finished; <see cref="Signed"/> reports whether certificate generation and document
/// stamping have also finished.
/// </summary>
public sealed record Envelope
{
    /// <summary>The unique ID of the envelope.</summary>
    public string Id { get; init; } = null!;

    /// <summary>Current status; see <see cref="EnvelopeStatus"/> for known values. "complete", "declined", and "canceled" are permanent.</summary>
    public string Status { get; init; } = null!;

    /// <summary>The envelope creator's profile ID.</summary>
    public string ProfileId { get; init; } = null!;

    /// <summary>The template the envelope was created from, or null if it was created directly.</summary>
    public string? TemplateId { get; init; }

    /// <summary>The organization the envelope belongs to.</summary>
    public string OrganizationId { get; init; } = null!;

    /// <summary>Name of the envelope. Inherited from the template by default, but may be overridden at creation.</summary>
    public string Name { get; init; } = null!;

    /// <summary>Overrides the sender name shown in places like the certificate. The js-sdk types this required, but the create handler writes null when no override is given.</summary>
    public string? SenderName { get; init; }

    /// <summary>Overrides the sender email address shown in places like the certificate. Null when no override is given, like <see cref="SenderName"/>.</summary>
    public string? SenderEmail { get; init; }

    /// <summary>If true, no email or SMS messages are sent to any recipient.</summary>
    public bool? NoContact { get; init; }

    /// <summary>Delay in milliseconds before the first reminder is sent (minimum four hours; the js-sdk doc comments say seconds but the handler stores and compares ms). Null or zero disables reminders.</summary>
    public long? InitialReminder { get; init; }

    /// <summary>Delay in milliseconds before subsequent reminders are sent (minimum twelve hours; ms for the same reason as InitialReminder). Null or zero disables follow-ups.</summary>
    public long? FollowupReminders { get; init; }

    /// <summary>Maximum number of days after envelope creation for which reminders are sent.</summary>
    public int MaxReminderDays { get; init; }

    /// <summary>When the next reminder is scheduled to be sent.</summary>
    public DateTimeOffset? NextReminder { get; init; }

    /// <summary>Creation date and time.</summary>
    public DateTimeOffset CreatedAt { get; init; }

    /// <summary>Last-update date and time.</summary>
    public DateTimeOffset UpdatedAt { get; init; }

    /// <summary>When the envelope was canceled, or null if it was not.</summary>
    public DateTimeOffset? CanceledAt { get; init; }

    /// <summary>When the envelope automatically expires, or null if it does not.</summary>
    public DateTimeOffset? ExpiresAt { get; init; }

    /// <summary>"private" or, to make the envelope visible to others in the organization, "shared". Ignored for personal profiles.</summary>
    public string Visibility { get; init; } = null!;

    /// <summary>True once the envelope is fully processed: certificate generated and every document stamped and signed.</summary>
    public bool Signed { get; init; }

    /// <summary>Arbitrary storage for integrators, for example source record IDs.</summary>
    public JsonElement? Data { get; init; }

    /// <summary>The creator's profile, when the API includes it.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public Profile? Profile { get; init; }

    /// <summary>The source template, when the API includes it.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public Template? Template { get; init; }

    /// <summary>The owning organization, when the API includes it.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public Organization? Organization { get; init; }

    /// <summary>Access keys issued for the envelope, when the API includes them.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyList<AccessKey>? AccessKeys { get; init; }

    /// <summary>Signing fields, when the API includes them.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyList<EnvelopeField>? Fields { get; init; }

    /// <summary>Audit-trail entries, when the API includes them.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyList<EnvelopeHistory>? HistoryEntries { get; init; }

    /// <summary>The envelope's recipients. Omitted by a few responses, such as update results.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyList<Recipient>? Recipients { get; init; }

    /// <summary>Documents attached to the envelope, when the API includes them.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyList<EnvelopeDocument>? Documents { get; init; }

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
