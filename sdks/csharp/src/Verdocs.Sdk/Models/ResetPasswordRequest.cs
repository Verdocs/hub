using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// Body for POST /v2/users/reset-password. Omit Code and NewPassword to start a reset;
/// include both to finish it.
/// </summary>
public sealed record ResetPasswordRequest
{
    /// <summary>Email address for the user account.</summary>
    public required string Email { get; init; }

    /// <summary>Emailed code, required to complete the reset.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Code { get; init; }

    /// <summary>New password, required to complete the reset.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? NewPassword { get; init; }
}
