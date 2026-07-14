using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>Details for <see cref="Resources.Contacts.CreateAsync"/>.</summary>
public sealed record CreateContactRequest
{
    /// <summary>First name for the contact.</summary>
    public required string FirstName { get; init; }

    /// <summary>Last name for the contact.</summary>
    public required string LastName { get; init; }

    /// <summary>Email address for the contact.</summary>
    public required string Email { get; init; }

    /// <summary>Phone number for the contact.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Phone { get; init; }
}
