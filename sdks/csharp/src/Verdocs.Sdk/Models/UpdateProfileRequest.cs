using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// Fields to change via <see cref="Resources.Profiles.UpdateAsync"/>. Unset properties are
/// omitted from the request, which matters because the deployed API validates strictly and
/// accepts different fields per target: updating your own profile accepts the names, phone,
/// timezone, and locale; updating another member's profile (admins only) accepts the names,
/// phone, permissions, and roles. Setting a field the target does not accept fails the call.
/// </summary>
public sealed record UpdateProfileRequest
{
    /// <summary>First name.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? FirstName { get; init; }

    /// <summary>Last name.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? LastName { get; init; }

    /// <summary>Phone number.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Phone { get; init; }

    /// <summary>The long-form timezone, for example "America/New_York". Own-profile updates only.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Timezone { get; init; }

    /// <summary>The locale code, for example "en-US". Own-profile updates only.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Locale { get; init; }

    /// <summary>Permissions to apply directly to the profile. Admin updates of another member only.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyList<string>? Permissions { get; init; }

    /// <summary>Roles to assign, for example "member" or "admin". Admin updates of another member only.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyList<string>? Roles { get; init; }
}
