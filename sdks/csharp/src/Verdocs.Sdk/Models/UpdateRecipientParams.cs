using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// Fields changeable via <see cref="Resources.Recipients.UpdateAsync"/>. Only set properties
/// are sent. The KBA prefill fields may only be changed while the recipient has not completed
/// KBA-based auth, and <see cref="Passcode"/> likewise for passcode-based auth.
/// </summary>
public sealed record UpdateRecipientParams
{
    /// <summary>Trigger a reminder invite ("remind") or fully reset the recipient's status ("reset").</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Action { get; init; }

    /// <summary>Update the recipient's first name.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? FirstName { get; init; }

    /// <summary>Update the recipient's last name.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? LastName { get; init; }

    /// <summary>Update the recipient's email address. A new invite is sent when this changes.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Email { get; init; }

    /// <summary>Update the recipient's phone number. A new invite is sent when this changes.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Phone { get; init; }

    /// <summary>Update the recipient's invite message. Leave blank for the default message.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Message { get; init; }

    /// <summary>If passcode authentication is used, the passcode to challenge the recipient with.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Passcode { get; init; }

    /// <summary>KBA address prefill.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Address { get; init; }

    /// <summary>KBA city prefill.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? City { get; init; }

    /// <summary>KBA state prefill.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? State { get; init; }

    /// <summary>KBA zip code prefill.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Zip { get; init; }

    /// <summary>KBA date-of-birth prefill.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Dob { get; init; }

    /// <summary>KBA SSN-last-4 prefill.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    [JsonPropertyName("ssn_last_4")]
    public string? SsnLast4 { get; init; }

    /// <summary>If true, the recipient may not change their legal name while signing. The js-sdk declares this as a string, but the field is a boolean flag everywhere else on the wire, so we send a real boolean.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public bool? NameLocked { get; init; }
}
