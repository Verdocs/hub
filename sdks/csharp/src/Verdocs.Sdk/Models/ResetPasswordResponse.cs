using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>Result of a password reset step.</summary>
public sealed record ResetPasswordResponse
{
    /// <summary>"OK" on success; see <see cref="RequestStatus"/> for known values.</summary>
    public string Status { get; init; } = null!;

    /// <summary>
    /// Advisory text. The deployed API sends it only on the initiate path for an unknown
    /// email, where a success-shaped answer deliberately avoids confirming which addresses
    /// have accounts.
    /// </summary>
    public string? Message { get; init; }

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
