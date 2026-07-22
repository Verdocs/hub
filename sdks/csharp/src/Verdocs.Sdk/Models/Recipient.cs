using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// A party in an envelope's signing workflow. Recipients act in <see cref="Sequence"/> order;
/// recipients sharing a sequence number may act in parallel.
/// </summary>
public sealed record Recipient
{
    /// <summary>Not stored in the backend; UI code uses it during builder processes.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Id { get; init; }

    /// <summary>The envelope the recipient belongs to.</summary>
    public string EnvelopeId { get; init; } = null!;

    /// <summary>The role the recipient fills. Recipients have no separate identifier; the role name identifies them.</summary>
    public string RoleName { get; init; } = null!;

    /// <summary>The recipient's profile, when they are a registered user.</summary>
    public string? ProfileId { get; init; }

    /// <summary>Current status; see <see cref="RecipientStatus"/> for known values.</summary>
    public string Status { get; init; } = null!;

    /// <summary>First name.</summary>
    public string FirstName { get; init; } = null!;

    /// <summary>Last name.</summary>
    public string LastName { get; init; } = null!;

    /// <summary>Full legal name. Deprecated: use the first and last names instead.</summary>
    public string? FullName { get; init; }

    /// <summary>Email address.</summary>
    public string Email { get; init; } = null!;

    /// <summary>Phone number for SMS invites.</summary>
    public string? Phone { get; init; }

    /// <summary>Street address, single string. Only used in KBA workflows.</summary>
    public string? Address { get; init; }

    /// <summary>City. Only used in KBA workflows.</summary>
    public string? City { get; init; }

    /// <summary>State. Only used in KBA workflows.</summary>
    public string? State { get; init; }

    /// <summary>Zip code. Only used in KBA workflows.</summary>
    public string? Zip { get; init; }

    /// <summary>Last four digits of the SSN. Only used in KBA workflows.</summary>
    [JsonPropertyName("ssn_last_4")]
    public string? SsnLast4 { get; init; }

    /// <summary>The disclosure text the recipient accepted.</summary>
    public string? Disclosures { get; init; }

    /// <summary>When the recipient agreed to their e-signing disclosures.</summary>
    public DateTimeOffset? DisclosuresAcceptedAt { get; init; }

    /// <summary>Date of birth. Only used in KBA workflows.</summary>
    public string? Dob { get; init; }

    /// <summary>The order in which recipients act. Recipients sharing a sequence number act in parallel.</summary>
    public int Sequence { get; init; }

    /// <summary>Display order of the recipient within its sequence level.</summary>
    public int Order { get; init; }

    /// <summary>Participation type; see <see cref="RecipientType"/> for known values.</summary>
    public string Type { get; init; } = null!;

    /// <summary>True when the recipient may delegate signing to someone else.</summary>
    public bool Delegator { get; init; }

    /// <summary>The role the recipient delegated to, if any.</summary>
    public string? DelegatedTo { get; init; }

    /// <summary>Message included in the recipient's invitation.</summary>
    public string? Message { get; init; }

    /// <summary>True once the recipient has claimed the envelope.</summary>
    public bool Claimed { get; init; }

    /// <summary>True once the recipient has agreed to the signing disclosures.</summary>
    public bool Agreed { get; init; }

    /// <summary>True when the recipient may not change their legal name while signing.</summary>
    public bool NameLocked { get; init; }

    /// <summary>The access key the recipient used to finish signing.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? KeyUsedToConclude { get; init; }

    /// <summary>Environment the recipient acted in.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Environment { get; init; }

    /// <summary>Creation date and time.</summary>
    public DateTimeOffset CreatedAt { get; init; }

    /// <summary>Last-update date and time.</summary>
    public DateTimeOffset UpdatedAt { get; init; }

    /// <summary>When contact with the recipient was last attempted.</summary>
    public DateTimeOffset? LastAttemptAt { get; init; }

    /// <summary>The locale code.</summary>
    public string? Locale { get; init; }

    /// <summary>The long-form timezone.</summary>
    public string? Timezone { get; init; }

    /// <summary>
    /// Key for in-person signing. Returned only to the envelope creator, on creation and detail
    /// responses. Sessions started with it are marked "In App" authenticated; higher levels
    /// (email, SMS) require the signer to follow the link sent on that channel.
    /// </summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? InAppKey { get; init; }

    /// <summary>The next verification step the recipient must perform; see <see cref="RecipientAuthMethod"/> for known values.</summary>
    public string? AuthStep { get; init; }

    /// <summary>The authentication methods required for the recipient; see <see cref="RecipientAuthMethod"/> for known values.</summary>
    public IReadOnlyList<string>? AuthMethods { get; init; }

    /// <summary>Per-method progress, keyed by auth method: "complete", "failed", "challenge", "questions", "differentiator", or null.</summary>
    public IReadOnlyDictionary<string, string?>? AuthMethodStates { get; init; }

    /// <summary>The required passcode when the passcode auth method is enabled. Visible only to the envelope creator.</summary>
    public string? Passcode { get; init; }

    /// <summary>Challenge or differentiator questions the recipient must answer in a KBA step.</summary>
    public IReadOnlyList<KbaQuestion>? KbaQuestions { get; init; }

    /// <summary>The envelope, when the API includes it.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public Envelope? Envelope { get; init; }

    /// <summary>The recipient's profile, when the API includes it.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public Profile? Profile { get; init; }

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
