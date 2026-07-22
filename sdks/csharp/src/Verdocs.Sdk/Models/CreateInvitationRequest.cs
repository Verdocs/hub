namespace Verdocs.Models;

/// <summary>Details for <see cref="Resources.Invitations.CreateAsync"/>.</summary>
public sealed record CreateInvitationRequest
{
    /// <summary>Email address to send the invitation to. For roles other than "contact", the server requires a business address rather than a free-mail one.</summary>
    public required string Email { get; init; }

    /// <summary>The invitee's first name. The user may change it after accepting.</summary>
    public required string FirstName { get; init; }

    /// <summary>The invitee's last name. The user may change it after accepting.</summary>
    public required string LastName { get; init; }

    /// <summary>The role the invitee will hold: "contact", "basic_user", "member", "admin", or "owner".</summary>
    public required string Role { get; init; }
}
