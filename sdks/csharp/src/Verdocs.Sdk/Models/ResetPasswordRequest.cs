using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// Parameters for <see cref="Resources.Auth.ResetPasswordAsync"/>. The reset is a two-step
/// flow: send only <see cref="Email"/> to have a reset code emailed to the user, then send
/// the same email plus <see cref="Code"/> and <see cref="NewPassword"/> to complete it.
/// </summary>
public sealed record ResetPasswordRequest
{
    /// <summary>Email address for the user account.</summary>
    public required string Email { get; init; }

    /// <summary>The emailed reset code. Omit to initiate a reset request.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Code { get; init; }

    /// <summary>The new password to set. Omit to initiate a reset request.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? NewPassword { get; init; }
}
