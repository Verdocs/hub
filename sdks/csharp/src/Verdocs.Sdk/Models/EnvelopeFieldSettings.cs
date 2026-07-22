using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// The legacy per-field settings blob on envelope fields. Deprecated in favor of the top-level
/// field properties; keys appear ad hoc, so every property is optional and omitted when null.
/// </summary>
public sealed record EnvelopeFieldSettings
{
    /// <summary>Field type recorded in the blob.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Type { get; init; }

    /// <summary>The X position of the field.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public double? X { get; init; }

    /// <summary>The Y position of the field.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public double? Y { get; init; }

    /// <summary>The width of the field.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public double? Width { get; init; }

    /// <summary>The height of the field.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public double? Height { get; init; }

    /// <summary>Configured value; the wire sends either a number or a string.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public JsonElement? Value { get; init; }

    /// <summary>The filled-in result, once the field has been completed.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public JsonElement? Result { get; init; }

    /// <summary>Line leading for text fields.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public double? Leading { get; init; }

    /// <summary>Text alignment for text fields.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public int? Alignment { get; init; }

    /// <summary>Whether text is forced to upper case.</summary>
    [JsonPropertyName("upperCase")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public bool? UpperCase { get; init; }

    /// <summary>Options for dropdowns, checkboxes, and radio groups.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyList<EnvelopeFieldOptions>? Options { get; init; }

    /// <summary>Signature or initial image data, base64 encoded.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Base64 { get; init; }

    /// <summary>Hash of the signed content.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Hash { get; init; }

    /// <summary>IP address recorded at signing.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? IpAddress { get; init; }

    /// <summary>Browser recorded at signing.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Browser { get; init; }

    /// <summary>Platform recorded at signing.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Platform { get; init; }

    /// <summary>Whether the signer used a mobile device.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public bool? Mobile { get; init; }

    /// <summary>The stored signature the field was completed with.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? SignatureId { get; init; }

    /// <summary>When the field was signed. Kept as a string because this legacy blob's format never settled.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? SignedAt { get; init; }

    /// <summary>Minimum boxes that must be checked in the group.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public int? MinimumChecked { get; init; }

    /// <summary>Maximum boxes that may be checked in the group.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public int? MaximumChecked { get; init; }

    /// <summary>Signature canvas height.</summary>
    [JsonPropertyName("canvasHeight")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public double? CanvasHeight { get; init; }

    /// <summary>Signature canvas width.</summary>
    [JsonPropertyName("canvasWidth")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public double? CanvasWidth { get; init; }

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
