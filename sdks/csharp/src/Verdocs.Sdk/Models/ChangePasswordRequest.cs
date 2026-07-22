namespace Verdocs.Models;

/// <summary>
/// Credentials for <see cref="Resources.Auth.ChangePasswordAsync"/>, used when the old
/// password is known (typically for logged-in users).
/// </summary>
public sealed record ChangePasswordRequest
{
    /// <summary>The caller's current password.</summary>
    public required string OldPassword { get; init; }

    /// <summary>The new password to set. Must meet strength requirements.</summary>
    public required string NewPassword { get; init; }
}
