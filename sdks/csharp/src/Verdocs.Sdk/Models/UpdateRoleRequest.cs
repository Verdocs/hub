using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// Body for <see cref="Resources.TemplateRoles.UpdateAsync"/>. Unset properties stay off the
/// wire and leave the stored values unchanged.
/// </summary>
public sealed record UpdateRoleRequest
{
    /// <summary>
    /// Renames the role. Role names must be unique within the template, so this fails if the
    /// new name is already in use.
    /// </summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Name { get; init; }

    /// <summary>Participation type; see <see cref="RecipientType"/>.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Type { get; init; }

    /// <summary>Default full name, completed or overridden when envelopes are created.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? FullName { get; init; }

    /// <summary>Default first name for the role.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? FirstName { get; init; }

    /// <summary>Default last name for the role.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? LastName { get; init; }

    /// <summary>Default email address for the role.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Email { get; init; }

    /// <summary>Default SMS-capable phone number for the role.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Phone { get; init; }

    /// <summary>
    /// Message to include in signing invitations. Sent for js-sdk parity, but the current
    /// server schema strips it on create and update, so it is effectively ignored.
    /// </summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Message { get; init; }

    /// <summary>1-based order in which roles act; roles sharing a sequence number act in parallel.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public int? Sequence { get; init; }

    /// <summary>1-based display order of the role within its sequence level.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public int? Order { get; init; }

    /// <summary>True when the recipient may delegate their signing responsibility to another party.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public bool? Delegator { get; init; }

    /// <summary>True when the recipient may not change their legal name while signing.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public bool? NameLocked { get; init; }
}
