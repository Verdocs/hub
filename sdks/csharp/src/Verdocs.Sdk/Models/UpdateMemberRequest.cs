using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// Changes for <see cref="Resources.Members.UpdateAsync"/>. The deployed API also accepts first
/// and last name here, which this SDK doesn't send yet; update names through the profile
/// endpoints for now.
/// </summary>
public sealed record UpdateMemberRequest
{
    /// <summary>Roles to assign: "contact", "member", "admin", or "owner". The deprecated "basic_user" is also accepted.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyList<string>? Roles { get; init; }
}
