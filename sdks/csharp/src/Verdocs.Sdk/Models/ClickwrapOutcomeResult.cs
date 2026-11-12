using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>The new record, as every call that records an outcome returns it.</summary>
public sealed record ClickwrapOutcomeResult
{
    /// <summary>The new record's ID.</summary>
    public string AcceptanceId { get; init; } = null!;

    /// <summary>What the person did; see <see cref="ClickwrapOutcome"/>.</summary>
    public string Outcome { get; init; } = null!;

    /// <summary>When the record was written, by our server's clock.</summary>
    public DateTimeOffset CreatedAt { get; init; }

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
