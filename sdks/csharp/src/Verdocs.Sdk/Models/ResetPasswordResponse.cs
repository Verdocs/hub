using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>Result of a reset-password call.</summary>
public sealed record ResetPasswordResponse
{
    /// <summary>Whether the call succeeded.</summary>
    public bool Success { get; init; }

    /// <summary>Wire fields this model does not cover yet.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
