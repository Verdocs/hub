using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>One audit-trail entry in an envelope's history.</summary>
public sealed record EnvelopeHistory
{
    /// <summary>The unique ID of the entry.</summary>
    public string Id { get; init; } = null!;

    /// <summary>The envelope the entry belongs to.</summary>
    public string EnvelopeId { get; init; } = null!;

    /// <summary>The role that performed or was affected by the event. Null for envelope-level events such as cancelation and expiry; the js-sdk types it required.</summary>
    public string? RoleName { get; init; }

    /// <summary>What happened; see <see cref="HistoryEvent"/> for known values.</summary>
    public string Event { get; init; } = null!;

    /// <summary>How or where it happened; see <see cref="Verdocs.Models.EventDetail"/> for common values. Modification events carry a free-form description.</summary>
    public string EventDetail { get; init; } = null!;

    /// <summary>When the event occurred.</summary>
    public DateTimeOffset CreatedAt { get; init; }

    /// <summary>The envelope, when the API includes it.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public Envelope? Envelope { get; init; }

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
