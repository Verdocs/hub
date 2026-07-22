using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>The person a recipient delegates their signing responsibility to (<see cref="Resources.Recipients.DelegateAsync"/>).</summary>
public sealed record DelegateRecipientRequest
{
    /// <summary>The first name of the new recipient.</summary>
    public required string FirstName { get; init; }

    /// <summary>The last name of the new recipient.</summary>
    public required string LastName { get; init; }

    /// <summary>The email address of the new recipient.</summary>
    public required string Email { get; init; }

    /// <summary>Optional phone number for the new recipient.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Phone { get; init; }

    /// <summary>Optional message for the new recipient's invitation.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Message { get; init; }
}
