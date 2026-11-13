using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>One agreement version in a record summary.</summary>
public sealed record ClickwrapAcceptanceSummaryAgreement
{
    /// <summary>The agreement's key.</summary>
    public string Key { get; init; } = null!;

    /// <summary>The version's ID.</summary>
    public string VersionId { get; init; } = null!;

    /// <summary>The version number.</summary>
    public int Number { get; init; }

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
