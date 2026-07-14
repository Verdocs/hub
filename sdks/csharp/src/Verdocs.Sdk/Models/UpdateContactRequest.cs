using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// Replacement values for <see cref="Resources.Contacts.UpdateAsync"/>. The server requires
/// the name and email fields on every update; only the phone may be omitted, which leaves it
/// unchanged.
/// </summary>
public sealed record UpdateContactRequest
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
