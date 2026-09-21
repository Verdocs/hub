using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>The multi-factor authentication summary carried on a <see cref="User"/> record.</summary>
public sealed record UserMfa
{
    /// <summary>True once the user has completed MFA enrollment.</summary>
    public bool Enabled { get; init; }

    /// <summary>When MFA was enabled, or null if it is not enabled.</summary>
    public DateTimeOffset? EnrolledAt { get; init; }

    /// <summary>The number of unused backup codes remaining.</summary>
    public int BackupCodesRemaining { get; init; }

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
