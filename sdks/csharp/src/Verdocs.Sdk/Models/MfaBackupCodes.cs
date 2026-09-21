using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// A set of one-time backup codes. They are returned only once, at the moment they are
/// generated, so show them to the user before the flow closes.
/// </summary>
public sealed record MfaBackupCodes
{
    /// <summary>Single-use backup codes, formatted xxxx-xxxx. Each may be used once in place of a TOTP code.</summary>
    public IReadOnlyList<string> BackupCodes { get; init; } = [];

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
