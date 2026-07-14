using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// Registration details for <see cref="Resources.Profiles.CreateAsync"/>: a new user account
/// plus the organization the caller will own. Users joining an existing organization are
/// invited by its admins instead.
/// </summary>
public sealed record CreateProfileRequest
{
    /// <summary>Email address for the new account.</summary>
    public required string Email { get; init; }

    /// <summary>Password for the new account.</summary>
    public required string Password { get; init; }

    /// <summary>First name.</summary>
    public required string FirstName { get; init; }

    /// <summary>Last name.</summary>
    public required string LastName { get; init; }

    /// <summary>
    /// Name for the new organization. It does not need to be unique; unrelated businesses
    /// often share a name.
    /// </summary>
    public required string OrgName { get; init; }

    /// <summary>Phone number. Optional on the wire even though the js-sdk type marks it required.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Phone { get; init; }

    /// <summary>The long-form timezone, for example "America/New_York".</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Timezone { get; init; }

    /// <summary>The locale code, for example "en-US".</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Locale { get; init; }
}
