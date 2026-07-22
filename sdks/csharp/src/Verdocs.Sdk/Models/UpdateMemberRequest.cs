using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// Changes for <see cref="Resources.Members.UpdateAsync"/>. The js-sdk also sends first and
/// last name, but the deployed API's strict schema rejects them; roles are the only field an
/// admin can change here.
/// </summary>
public sealed record UpdateMemberRequest
{
    /// <summary>Roles to assign. The deployed schema accepts "contact", "basic_user", "admin", and "owner" here; "member" is currently rejected on update.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyList<string>? Roles { get; init; }
}
