using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>Result of POST /v2/users/resend-verification.</summary>
public sealed record ResendVerificationResponse
{
    /// <summary>Confirmation string from the server, typically "done".</summary>
    public string Result { get; init; } = null!;

    /// <summary>Wire fields this model does not cover yet.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
