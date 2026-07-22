using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>Response marker telling the caller a PIN must be entered to continue a KBA flow.</summary>
public sealed record KbaPinRequired
{
    /// <summary>Always "pin".</summary>
    public string Type { get; init; } = "pin";

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
