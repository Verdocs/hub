using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>A pending invitation for a person to join an organization.</summary>
public sealed record OrganizationInvitation
{
    /// <summary>The organization the person is invited to.</summary>
    public string OrganizationId { get; init; } = null!;

    /// <summary>The invitee's email address.</summary>
    public string Email { get; init; } = null!;

    /// <summary>The invitee's first name.</summary>
    public string FirstName { get; init; } = null!;

    /// <summary>The invitee's last name.</summary>
    public string LastName { get; init; } = null!;

    /// <summary>Invitation status. Always "pending"; accepted invitations are deleted.</summary>
    public string Status { get; init; } = null!;

    /// <summary>The role the invitee will hold, for example "member" or "admin".</summary>
    public string Role { get; init; } = null!;

    /// <summary>When the invitation was generated.</summary>
    public DateTimeOffset GeneratedAt { get; init; }

    /// <summary>Invitation token. Returned only to callers allowed to redeem or resend it.</summary>
    public string? Token { get; init; }

    /// <summary>The inviting organization, when the API includes it.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public Organization? Organization { get; init; }

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
