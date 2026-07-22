using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>An in-app notification delivered to a profile.</summary>
public sealed record Notification
{
    /// <summary>The unique ID of the notification.</summary>
    public string Id { get; init; } = null!;

    /// <summary>The profile the notification was delivered to.</summary>
    public string ProfileId { get; init; } = null!;

    /// <summary>The event that produced the notification; see <see cref="Verdocs.Models.EventName"/> for known values.</summary>
    public string EventName { get; init; } = null!;

    /// <summary>Event-specific payload, for example the envelope involved.</summary>
    public JsonElement? Data { get; init; }

    /// <summary>True once the profile has read the notification.</summary>
    public bool Read { get; init; }

    /// <summary>True once the profile has dismissed the notification.</summary>
    public bool Deleted { get; init; }

    /// <summary>Human-readable notification text.</summary>
    public string Message { get; init; } = null!;

    /// <summary>When the notification was generated.</summary>
    public DateTimeOffset Time { get; init; }

    /// <summary>The recipient profile, when the API includes it.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public Profile? Profile { get; init; }

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
