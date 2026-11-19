using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>Whether one person is current on one agreement.</summary>
public sealed record ClickwrapStatus
{
    /// <summary>The agreement's key.</summary>
    public string Key { get; init; } = null!;

    /// <summary>True when the person accepted a published version at or after the newest one that requires re-acceptance.</summary>
    public bool Current { get; init; }

    /// <summary>The version they would be shown, or null when they're current.</summary>
    public ClickwrapPendingVersion? PendingVersion { get; init; }

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
