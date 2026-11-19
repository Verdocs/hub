using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>The agreement a record item points to.</summary>
public sealed record ClickwrapAcceptanceItemAgreement
{
    /// <summary>The agreement's key.</summary>
    public string Key { get; init; } = null!;

    /// <summary>The agreement's name.</summary>
    public string Name { get; init; } = null!;

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
