using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>One checkbox label as it was shown.</summary>
public sealed record ClickwrapAgreementLabel
{
    /// <summary>The version the checkbox was for.</summary>
    public required string VersionId { get; init; }

    /// <summary>The checkbox label, as rendered.</summary>
    public required string Label { get; init; }

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
