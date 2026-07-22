using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// The legacy per-field settings blob on template fields. Deprecated in favor of the top-level
/// field properties; keys appear ad hoc, so every property is optional and omitted when null,
/// and anything else the wire sends rides in the extension data.
/// </summary>
public sealed record TemplateFieldSetting
{
    /// <summary>The X position of the field.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public double? X { get; init; }

    /// <summary>The Y position of the field.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public double? Y { get; init; }

    /// <summary>The filled-in result, once the field has been completed.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Result { get; init; }

    /// <summary>The width of the field.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public double? Width { get; init; }

    /// <summary>The height of the field.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public double? Height { get; init; }

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

    /// <summary>Options for dropdowns, checkboxes, and radio groups. Kept raw; the wire shape varies.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public JsonElement? Options { get; init; }

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
