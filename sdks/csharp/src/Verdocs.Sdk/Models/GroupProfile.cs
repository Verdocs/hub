using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>One profile's membership in a group.</summary>
public sealed record GroupProfile
{
    /// <summary>The group.</summary>
    public string GroupId { get; init; } = null!;

    /// <summary>The member profile.</summary>
    public string ProfileId { get; init; } = null!;

    /// <summary>The organization both belong to.</summary>
    public string OrganizationId { get; init; } = null!;

    /// <summary>The group, when the API includes it.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public Group? Group { get; init; }

    /// <summary>The member profile, when the API includes it.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public Profile? Profile { get; init; }

    /// <summary>The organization, when the API includes it.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public Organization? Organization { get; init; }

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
