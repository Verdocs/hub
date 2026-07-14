using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>A named set of profiles sharing a block of permissions.</summary>
public sealed record Group
{
    /// <summary>The unique ID of the group.</summary>
    public string Id { get; init; } = null!;

    /// <summary>Display name for the group.</summary>
    public string Name { get; init; } = null!;

    /// <summary>The organization the group belongs to.</summary>
    public string OrganizationId { get; init; } = null!;

    /// <summary>Permissions granted to the group's members.</summary>
    public IReadOnlyList<string> Permissions { get; init; } = [];

    /// <summary>The owning organization, when the API includes it.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public Organization? Organization { get; init; }

    /// <summary>The group's memberships, when the API includes them.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyList<GroupProfile>? Profiles { get; init; }

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
