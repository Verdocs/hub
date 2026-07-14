using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>A saved initials image belonging to a profile.</summary>
public sealed record Initial
{
    /// <summary>The unique ID of the initials record.</summary>
    public string? Id { get; init; }

    /// <summary>The owning profile.</summary>
    public string ProfileId { get; init; } = null!;

    /// <summary>Creation date and time.</summary>
    public DateTimeOffset? CreatedAt { get; init; }

    /// <summary>Last-update date and time.</summary>
    public DateTimeOffset? UpdatedAt { get; init; }

    /// <summary>When the initials were deleted, or null while they are live.</summary>
    public DateTimeOffset? DeletedAt { get; init; }

    /// <summary>The owning profile, when the API includes it.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public Profile? Profile { get; init; }

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
