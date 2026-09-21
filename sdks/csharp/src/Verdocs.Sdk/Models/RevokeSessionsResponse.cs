using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>The result of revoking the caller's other sessions.</summary>
public sealed record RevokeSessionsResponse
{
    /// <summary>The number of sessions revoked. The caller's current session is never included.</summary>
    public int Revoked { get; init; }

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
