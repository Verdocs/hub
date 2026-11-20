using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// Identity details a recipient supplies for SMS, KBA, and ID verification. We keep them apart
/// from the recipient so they can be purged once they're no longer needed.
/// </summary>
public sealed record RecipientInformation
{
    /// <summary>The envelope the recipient belongs to.</summary>
    public string EnvelopeId { get; init; } = null!;

    /// <summary>The role the recipient fills.</summary>
    public string RoleName { get; init; } = null!;

    /// <summary>Phone number for SMS invites.</summary>
    public string? Phone { get; init; }

    /// <summary>Street address. Only used in KBA workflows.</summary>
    public string? Address { get; init; }

    /// <summary>Second address line. Only used in KBA workflows.</summary>
    [JsonPropertyName("address_2")]
    public string? Address2 { get; init; }

    /// <summary>City. Only used in KBA workflows.</summary>
    public string? City { get; init; }

    /// <summary>State. Only used in KBA workflows.</summary>
    public string? State { get; init; }

    /// <summary>Zip code. Only used in KBA workflows.</summary>
    public string? Zip { get; init; }

    /// <summary>Country.</summary>
    public string Country { get; init; } = null!;

    /// <summary>Last four digits of the SSN. Only used in KBA workflows.</summary>
    [JsonPropertyName("ssn_last_4")]
    public string? SsnLast4 { get; init; }

    /// <summary>Date of birth. Only used in KBA workflows.</summary>
    public string? Dob { get; init; }

    /// <summary>The ID capture provider's reference for the recipient's verification.</summary>
    public string? IdCaptureRef { get; init; }

    /// <summary>The ID capture provider's verification result.</summary>
    public JsonElement? IdCaptureResult { get; init; }

    /// <summary>The KBA provider's session for the recipient's verification.</summary>
    public string? KbaSessionId { get; init; }

    /// <summary>Challenge or differentiator questions from the recipient's KBA step.</summary>
    public IReadOnlyList<KbaQuestion>? KbaQuestions { get; init; }

    /// <summary>When the sensitive values are due to be cleared.</summary>
    public DateTimeOffset? PurgeAt { get; init; }

    /// <summary>When the sensitive values were cleared. The record itself stays.</summary>
    public DateTimeOffset? PurgedAt { get; init; }

    /// <summary>Encryption key version, for key rotation.</summary>
    public string EncryptionKeyVersion { get; init; } = null!;

    /// <summary>Creation date and time.</summary>
    public DateTimeOffset CreatedAt { get; init; }

    /// <summary>Last-update date and time.</summary>
    public DateTimeOffset UpdatedAt { get; init; }

    /// <summary>The recipient, when the API includes it.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public Recipient? Recipient { get; init; }

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
