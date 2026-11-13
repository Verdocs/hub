using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>How many people accepted one published version.</summary>
public sealed record ClickwrapCoverageVersion
{
    /// <summary>The version's ID.</summary>
    public string Id { get; init; } = null!;

    /// <summary>The version number.</summary>
    public int Number { get; init; }

    /// <summary>When the version was published.</summary>
    public DateTimeOffset? PublishedAt { get; init; }

    /// <summary>Whether the version requires everyone to accept again.</summary>
    public bool RequiresReacceptance { get; init; }

    /// <summary>Distinct people who accepted this version.</summary>
    public int People { get; init; }

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
