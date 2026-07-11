using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>One selectable option in a dropdown field.</summary>
public sealed record DropdownOption
{
    /// <summary>The stored value of the option.</summary>
    public string Id { get; init; } = null!;

    /// <summary>The label shown to the participant.</summary>
    public string Label { get; init; } = null!;

    /// <summary>Wire fields this seed model does not cover yet, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
