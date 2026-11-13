using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>One agreement version in a full record.</summary>
public sealed record ClickwrapAcceptanceItem
{
    /// <summary>SHA-256 hex of the version's text, as recorded.</summary>
    public string ContentHash { get; init; } = null!;

    /// <summary>The version.</summary>
    public ClickwrapAcceptanceItemVersion AgreementVersion { get; init; } = null!;

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
