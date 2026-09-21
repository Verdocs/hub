using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>The caller's multi-factor authentication status.</summary>
public sealed record MfaStatus
{
    /// <summary>True if the caller has completed MFA enrollment.</summary>
    public bool Enabled { get; init; }

    /// <summary>The type of second factor enrolled (see <see cref="MfaType"/>), or null if MFA is not enabled.</summary>
    public string? Type { get; init; }

    /// <summary>When MFA was enabled, or null if it is not enabled.</summary>
    public DateTimeOffset? EnrolledAt { get; init; }

    /// <summary>The number of unused backup codes remaining.</summary>
    public int BackupCodesRemaining { get; init; }

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
