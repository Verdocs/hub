using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>A profile's opt-out from one notification channel.</summary>
public sealed record DisabledChannel
{
    /// <summary>The channel the profile opted out of.</summary>
    public string ChannelId { get; init; } = null!;

    /// <summary>The profile that opted out.</summary>
    public string ProfileId { get; init; } = null!;

    /// <summary>The opted-out profile, when the API includes it.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public Profile? Profile { get; init; }

    /// <summary>The channel, when the API includes it.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public Channel? Channel { get; init; }

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
