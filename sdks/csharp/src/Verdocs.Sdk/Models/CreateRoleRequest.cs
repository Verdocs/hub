using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// Body for <see cref="Resources.TemplateRoles.CreateAsync"/> and inline role creation in
/// <see cref="CreateTemplateRequest.Roles"/>. Role names must be unique within the template.
/// They may contain spaces, but later calls URL-encode the name into the request path, so
/// simple names are easier to work with. The server derives full_name from first/last names
/// and vice versa when only one form is sent.
/// </summary>
public sealed record CreateRoleRequest
{
    /// <summary>Name for the new role, unique within the template, for example "Recipient 1".</summary>
    public required string Name { get; init; }

    /// <summary>Participation type; see <see cref="RecipientType"/>. The server defaults to signer.</summary>
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

    /// <summary>
    /// 1-based order in which roles act; roles sharing a sequence number act in parallel and
    /// are invited together. The server defaults to 1.
    /// </summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public int? Sequence { get; init; }

    /// <summary>1-based display order of the role within its sequence level. The server defaults to 1.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public int? Order { get; init; }

    /// <summary>True when the recipient may delegate their signing responsibility to another party.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public bool? Delegator { get; init; }

    /// <summary>True when the recipient may not change their legal name while signing.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public bool? NameLocked { get; init; }
}
