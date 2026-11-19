using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>The brand a session is themed with.</summary>
public sealed record ClickwrapSessionBrand
{
    /// <summary>The brand's name.</summary>
    public string Name { get; init; } = null!;

    /// <summary>The full logo's URL.</summary>
    public string? FullLogoUrl { get; init; }

    /// <summary>The small logo's URL.</summary>
    public string? ThumbnailUrl { get; init; }

    /// <summary>The primary color, as CSS.</summary>
    public string? PrimaryColor { get; init; }

    /// <summary>The secondary color, as CSS.</summary>
    public string? SecondaryColor { get; init; }

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
