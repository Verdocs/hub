using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// A person acting within an organization. A user may have one profile per organization
/// membership; exactly one is current at a time and operations are performed as that profile.
/// Some profiles (contacts, signers) have no user attached.
/// </summary>
public sealed record Profile
{
    /// <summary>The unique ID of the profile.</summary>
    public string Id { get; init; } = null!;

    /// <summary>The owning user's ID, or null for profiles without a registered user.</summary>
    public string? UserId { get; init; }

    /// <summary>The profile's organization ID.</summary>
    public string OrganizationId { get; init; } = null!;

    /// <summary>First name.</summary>
    public string FirstName { get; init; } = null!;

    /// <summary>Last name.</summary>
    public string LastName { get; init; } = null!;

    /// <summary>Email address.</summary>
    public string Email { get; init; } = null!;

    /// <summary>Phone number.</summary>
    public string? Phone { get; init; }

    /// <summary>URL of the profile photo.</summary>
    public string? Picture { get; init; }

    /// <summary>True if this is the caller's currently selected profile.</summary>
    public bool Current { get; init; }

    /// <summary>Permissions directly assigned to the profile.</summary>
    public IReadOnlyList<string> Permissions { get; init; } = [];

    /// <summary>Roles assigned to the profile, for example "member" or "owner".</summary>
    public IReadOnlyList<string> Roles { get; init; } = [];

    /// <summary>The locale code.</summary>
    public string? Locale { get; init; }

    /// <summary>The long-form timezone.</summary>
    public string? Timezone { get; init; }

    /// <summary>Creation date and time.</summary>
    public DateTimeOffset CreatedAt { get; init; }

    /// <summary>Last-update date and time.</summary>
    public DateTimeOffset UpdatedAt { get; init; }

    /// <summary>The organization the profile belongs to, when the API includes it.</summary>
    public Organization? Organization { get; init; }

    /// <summary>Wire fields this seed model does not cover yet, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
