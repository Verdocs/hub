using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>One event in a record's trail.</summary>
public sealed record ClickwrapAcceptanceEvent
{
    /// <summary>What happened; see <see cref="ClickwrapEventType"/>.</summary>
    public string Event { get; init; } = null!;

    /// <summary>The agreement a checkbox event was for, or null for other events.</summary>
    public string? AgreementId { get; init; }

    /// <summary>The browser's clock when it happened, if the browser reported it.</summary>
    public DateTimeOffset? ClientAt { get; init; }

    /// <summary>When it reached our server.</summary>
    public DateTimeOffset CreatedAt { get; init; }

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
