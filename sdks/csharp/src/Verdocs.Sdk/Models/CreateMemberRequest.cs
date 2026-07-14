using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// Details for <see cref="Resources.Members.CreateAsync"/>, which provisions a member
/// directly instead of sending an invitation.
/// </summary>
public sealed record CreateMemberRequest
{
    /// <summary>Email address for the member.</summary>
    public required string Email { get; init; }

    /// <summary>First name for the member (1 to 100 characters).</summary>
    public required string FirstName { get; init; }

    /// <summary>Last name for the member (1 to 100 characters).</summary>
    public required string LastName { get; init; }

    /// <summary>Initial password (8 to 128 characters). When omitted and the user is new, the server generates one and returns it.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Password { get; init; }

    /// <summary>Roles to assign: "basic_user", "member", "admin", or "owner". The server defaults to ["member"]. Contacts are created through <see cref="Resources.Contacts.CreateAsync"/> instead.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyList<string>? Roles { get; init; }
}
