using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>The browser window the terms were shown in.</summary>
public sealed record ClickwrapViewport
{
    /// <summary>Width in CSS pixels.</summary>
    public required int Width { get; init; }

    /// <summary>Height in CSS pixels.</summary>
    public required int Height { get; init; }

    /// <summary>The device pixel ratio.</summary>
    public required double DevicePixelRatio { get; init; }

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
