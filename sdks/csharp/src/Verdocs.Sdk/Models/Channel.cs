using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>A notification delivery channel for one event type.</summary>
public sealed record Channel
{
    /// <summary>The unique ID of the channel.</summary>
    public string Id { get; init; } = null!;

    /// <summary>The delivery mechanism, for example "email".</summary>
    public string ChannelType { get; init; } = null!;

    /// <summary>The event the channel delivers; see <see cref="Verdocs.Models.EventName"/> for known values.</summary>
    public string EventName { get; init; } = null!;

    /// <summary>Per-profile opt-outs for this channel, when the API includes them.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyList<DisabledChannel>? DisabledChannels { get; init; }

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
