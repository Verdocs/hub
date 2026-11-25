using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>One photo to retake after a failed ID verification attempt, and why.</summary>
public sealed record IdImageErrors
{
    /// <summary>The photo to retake; see <see cref="IdImageField"/> for known values.</summary>
    public string Image { get; init; } = null!;

    /// <summary>Why it needs retaking; see <see cref="IdImageError"/> for known values.</summary>
    public IReadOnlyList<string> Errors { get; init; } = [];

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
