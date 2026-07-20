using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>Result of a change-password call.</summary>
public sealed record ChangePasswordResponse
{
    /// <summary>Status string from the server, typically "OK".</summary>
    public string Status { get; init; } = null!;

    /// <summary>Human-readable message from the server.</summary>
    public string Message { get; init; } = null!;

    /// <summary>Wire fields this model does not cover yet.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
