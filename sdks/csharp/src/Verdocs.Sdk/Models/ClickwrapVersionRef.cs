using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>A short reference to one agreement version.</summary>
public sealed record ClickwrapVersionRef
{
    /// <summary>The version's ID.</summary>
    public string Id { get; init; } = null!;

    /// <summary>The version number: 1, 2, 3, unique within the agreement.</summary>
    public int Number { get; init; }

    /// <summary>draft or published; see <see cref="ClickwrapVersionStatus"/>.</summary>
    public string Status { get; init; } = null!;

    /// <summary>When the version was published, or null for a draft.</summary>
    public DateTimeOffset? PublishedAt { get; init; }

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
