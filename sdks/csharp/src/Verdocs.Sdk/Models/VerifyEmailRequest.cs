namespace Verdocs.Models;

/// <summary>Parameters for <see cref="Resources.Auth.VerifyEmailAsync"/>.</summary>
public sealed record VerifyEmailRequest
{
    /// <summary>Email address being verified.</summary>
    public required string Email { get; init; }

    /// <summary>The verification code the user received by email.</summary>
    public required string Token { get; init; }
}
