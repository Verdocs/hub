namespace Verdocs.Models;

/// <summary>
/// Details for <see cref="Resources.Invitations.AcceptAsync"/>. Every field is required by
/// the server, but it currently takes the first and last name from the invitation itself, so
/// the names sent here only matter if that changes.
/// </summary>
public sealed record AcceptOrganizationInvitationRequest
{
    /// <summary>The invitee's email address.</summary>
    public required string Email { get; init; }

    /// <summary>The invite token from the invitation email.</summary>
    public required string Token { get; init; }

    /// <summary>First name for the new user.</summary>
    public required string FirstName { get; init; }

    /// <summary>Last name for the new user.</summary>
    public required string LastName { get; init; }

    /// <summary>Password for the new user. Ignored when a user already exists for the email.</summary>
    public required string Password { get; init; }
}
