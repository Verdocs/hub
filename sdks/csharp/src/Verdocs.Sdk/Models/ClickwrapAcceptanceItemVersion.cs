using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>The version a record item points to.</summary>
public sealed record ClickwrapAcceptanceItemVersion
{
    /// <summary>The version's ID.</summary>
    public string Id { get; init; } = null!;

    /// <summary>The version number.</summary>
    public int Number { get; init; }

    /// <summary>When the version was published.</summary>
    public DateTimeOffset? PublishedAt { get; init; }

    /// <summary>The agreement the version belongs to.</summary>
    public ClickwrapAcceptanceItemAgreement Agreement { get; init; } = null!;

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
