using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>A short-lived download link for one of a record's files.</summary>
public sealed record ClickwrapDownloadLink
{
    /// <summary>Which file the link is for; see <see cref="ClickwrapDownloadType"/>.</summary>
    public string Type { get; init; } = null!;

    /// <summary>The link. It always downloads as an attachment.</summary>
    public string Url { get; init; } = null!;

    /// <summary>How long the link works, in seconds.</summary>
    public int ExpiresIn { get; init; }

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
