using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>Each checkbox label and the button label, as they were shown.</summary>
public sealed record ClickwrapLabels
{
    /// <summary>One label per agreement checkbox.</summary>
    public required IReadOnlyList<ClickwrapAgreementLabel> Agreements { get; init; }

    /// <summary>The accept or decline button's label.</summary>
    public required string Button { get; init; }

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
