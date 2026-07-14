using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>The legacy settings blob shape for completed text fields.</summary>
public sealed record TextFieldSetting
{
    /// <summary>The X position of the field.</summary>
    public double X { get; init; }

    /// <summary>The Y position of the field.</summary>
    public double Y { get; init; }

    /// <summary>The width of the field.</summary>
    public double Width { get; init; }

    /// <summary>The height of the field.</summary>
    public double Height { get; init; }

    /// <summary>The entered text.</summary>
    public string Result { get; init; } = null!;

    /// <summary>Line leading.</summary>
    public double Leading { get; init; }

    /// <summary>Text alignment.</summary>
    public int Alignment { get; init; }

    /// <summary>Whether text is forced to upper case.</summary>
    [JsonPropertyName("upperCase")]
    public bool UpperCase { get; init; }

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
