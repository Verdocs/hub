using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// A placeholder for a party in a signing flow. Known roles carry contact details in the
/// template; unknown roles are filled in when an envelope is created from it. Roles have no
/// separate ID; they are uniquely identified by name within their template.
/// </summary>
public sealed record Role
{
    /// <summary>The template the role belongs to.</summary>
    public string TemplateId { get; init; } = null!;

    /// <summary>The name of the role, for example "Recipient 1".</summary>
    public string Name { get; init; } = null!;

    /// <summary>The role's participation type: "signer", "cc", or "approver".</summary>
    public string Type { get; init; } = null!;

    /// <summary>Full legal name, for known roles.</summary>
    public string? FullName { get; init; }

    /// <summary>First name, for known roles.</summary>
    public string? FirstName { get; init; }

    /// <summary>Last name, for known roles.</summary>
    public string? LastName { get; init; }

    /// <summary>Email address, for known roles.</summary>
    public string? Email { get; init; }

    /// <summary>Phone number, for known roles.</summary>
    public string? Phone { get; init; }

    /// <summary>Message included in the role's invitation.</summary>
    public string? Message { get; init; }

    /// <summary>The order in which roles act. Roles sharing a sequence number act in parallel.</summary>
    public int Sequence { get; init; }

    /// <summary>Display order of the role within its sequence level.</summary>
    public int Order { get; init; }

    /// <summary>True when the recipient may delegate signing to someone else.</summary>
    public bool? Delegator { get; init; }

    /// <summary>True when the recipient may not change their legal name while signing.</summary>
    public bool NameLocked { get; init; }

    /// <summary>Wire fields this seed model does not cover yet, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
