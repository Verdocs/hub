using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>A saved signature image belonging to a profile.</summary>
public sealed record Signature
{
    /// <summary>The unique ID of the signature.</summary>
    public string Id { get; init; } = null!;

    /// <summary>The owning profile.</summary>
    public string ProfileId { get; init; } = null!;

    /// <summary>Creation date and time.</summary>
    public DateTimeOffset CreatedAt { get; init; }

    /// <summary>Last-update date and time.</summary>
    public DateTimeOffset UpdatedAt { get; init; }

    /// <summary>When the signature was deleted, or null while it is live.</summary>
    public DateTimeOffset? DeletedAt { get; init; }

    /// <summary>The owning profile, when the API includes it.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public Profile? Profile { get; init; }

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
