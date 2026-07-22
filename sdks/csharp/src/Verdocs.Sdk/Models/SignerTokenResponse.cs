using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// A signing session: the token to authorize signing calls with, plus the envelope and
/// recipient metadata almost every signing flow needs immediately.
/// </summary>
public sealed record SignerTokenResponse
{
    /// <summary>An access token for signing operations, applied with <see cref="VerdocsEndpoint.SetToken"/> as a signing session.</summary>
    public string AccessToken { get; init; } = null!;

    /// <summary>A copy of the envelope being signed.</summary>
    public Envelope Envelope { get; init; } = null!;

    /// <summary>A copy of the recipient record for the session.</summary>
    public Recipient Recipient { get; init; } = null!;

    /// <summary>Stored signature blocks for the recipient. Most flows use only the first entry.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyList<Signature>? Signatures { get; init; }

    /// <summary>Stored initials blocks for the recipient. Most flows use only the first entry.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyList<Initial>? Initials { get; init; }

    /// <summary>The org's default brand, if one is set. Kept raw because the js-sdk types it loosely (style_overrides CSS and other branding fields).</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public JsonElement? Brand { get; init; }

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
