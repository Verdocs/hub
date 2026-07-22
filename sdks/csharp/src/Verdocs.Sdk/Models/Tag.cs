using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>A label that can be attached to templates to aid discovery and filtering.</summary>
public sealed record Tag
{
    /// <summary>The name of the tag. Tags have no separate ID; the name identifies them.</summary>
    public string Name { get; init; } = null!;

    /// <summary>True when the tag is featured in discovery views.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public bool? Featured { get; init; }

    /// <summary>The organization the tag belongs to, when scoped to one.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? OrganizationId { get; init; }

    /// <summary>Creation date and time.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public DateTimeOffset? CreatedAt { get; init; }

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
