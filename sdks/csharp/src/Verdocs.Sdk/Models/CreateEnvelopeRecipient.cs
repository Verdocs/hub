using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// One recipient in a <see cref="CreateEnvelopeRequest"/>. The js-sdk splits this into template
/// and direct variants (ICreateEnvelopeRecipientFromTemplate and ICreateEnvelopeRecipientDirectly)
/// that differ only in whether <see cref="Type"/>, <see cref="Sequence"/>, and <see cref="Order"/>
/// are declared; one record covers both. Two server rules worth knowing: duplicate recipient
/// emails within one envelope are rejected, and a recipient with all of <see cref="Address"/>,
/// <see cref="City"/>, <see cref="State"/>, <see cref="Zip"/>, and <see cref="Dob"/> populated
/// is rejected ("At least one KBA-related field must be left blank").
/// </summary>
public sealed record CreateEnvelopeRecipient
{
    /// <summary>Participation type; see <see cref="RecipientType"/> for known values. Most participants in standard flows are signers. Optional on the server even though the js-sdk's direct-create type requires it.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Type { get; init; }

    /// <summary>Unique identifier for the recipient. When using a template, must match one of the template's role names.</summary>
    public required string RoleName { get; init; }

    /// <summary>First name of the recipient.</summary>
    public required string FirstName { get; init; }

    /// <summary>Last name of the recipient.</summary>
    public required string LastName { get; init; }

    /// <summary>
    /// The email address of the recipient. The server requires this key on every recipient, so
    /// it is always serialized: for phone-only recipients leave it empty and set
    /// <see cref="Phone"/>, and the invitation goes out by SMS.
    /// </summary>
    public string Email { get; init; } = "";

    /// <summary>The phone number of the recipient. Required (by the server) when <see cref="Email"/> is empty; when set, the recipient is invited by SMS.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Phone { get; init; }

    /// <summary>The 1-based sequence number. Recipients sharing a sequence act in parallel; sequences complete in series.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public int? Sequence { get; init; }

    /// <summary>The 1-based display order within the sequence.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public int? Order { get; init; }

    /// <summary>Whether the recipient may delegate their tasks to others. Leave false for most standard workflows.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public bool? Delegator { get; init; }

    /// <summary>A custom message for the email or SMS invitation. Leave blank for the default message.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Message { get; init; }

    /// <summary>Authentication methods to require; see <see cref="RecipientAuthMethod"/> for known values.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyList<string>? AuthMethods { get; init; }

    /// <summary>If passcode authentication is used, the passcode to challenge the recipient with. The server requires at least 4 characters.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Passcode { get; init; }

    /// <summary>
    /// If SMS authentication is used, the phone number one-time codes go to. This may differ
    /// from <see cref="Phone"/>, and leaving it blank is an error rather than a fallback so a
    /// misconfigured org (SMS auth on, SMS notifications off) fails loudly.
    /// </summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? PhoneAuth { get; init; }

    /// <summary>Pre-fill KBA address for the recipient, if known.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Address { get; init; }

    /// <summary>Pre-fill KBA city for the recipient, if known.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? City { get; init; }

    /// <summary>Pre-fill KBA state for the recipient, if known.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? State { get; init; }

    /// <summary>Pre-fill KBA zip for the recipient, if known.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Zip { get; init; }

    /// <summary>Pre-fill KBA date of birth for the recipient, if known.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Dob { get; init; }

    /// <summary>Pre-fill KBA SSN-last-4 for the recipient, if known.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    [JsonPropertyName("ssn_last_4")]
    public string? SsnLast4 { get; init; }
}
