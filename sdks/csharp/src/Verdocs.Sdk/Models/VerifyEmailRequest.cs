namespace Verdocs.Models;

/// <summary>Body for POST /v2/users/verify when email and token are known.</summary>
public sealed record VerifyEmailRequest
{
    /// <summary>Email address for the user account.</summary>
    public required string Email { get; init; }

    /// <summary>Verification token from the email link.</summary>
    public required string Token { get; init; }
}
