using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>Result of a password change.</summary>
public sealed record ChangePasswordResponse
{
    /// <summary>"OK" on success; see <see cref="RequestStatus"/> for known values.</summary>
    public string Status { get; init; } = null!;

    /// <summary>Failure detail. The deployed API omits it on success and reports failures as HTTP errors instead.</summary>
    public string? Message { get; init; }

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
