using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>The version a person would be shown next.</summary>
public sealed record ClickwrapPendingVersion
{
    /// <summary>The version's ID.</summary>
    public string Id { get; init; } = null!;

    /// <summary>The version number.</summary>
    public int Number { get; init; }

    /// <summary>Whether the version requires everyone to accept again.</summary>
    public bool RequiresReacceptance { get; init; }

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
