namespace Verdocs.Models;

/// <summary>Body for POST /v2/users/change-password when the old password is known.</summary>
public sealed record ChangePasswordRequest
{
    /// <summary>Current password for the caller.</summary>
    public required string OldPassword { get; init; }

    /// <summary>New password to set. Must meet strength requirements.</summary>
    public required string NewPassword { get; init; }
}
