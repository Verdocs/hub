using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// A user account. A user represents a single person; the person acts within an organization
/// through a <see cref="Profile"/>, and one user may hold several profiles.
/// </summary>
public sealed record User
{
    /// <summary>The unique ID of the user.</summary>
    public string Id { get; init; } = null!;

    /// <summary>Email address.</summary>
    public string Email { get; init; } = null!;

    /// <summary>True once the email has been verified, by OTP or a trusted third party.</summary>
    public bool EmailVerified { get; init; }

    /// <summary>Never returned by the backend; the js-sdk declares it for type consistency only.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? PassHash { get; init; }

    /// <summary>First name.</summary>
    public string? FirstName { get; init; }

    /// <summary>Last name.</summary>
    public string? LastName { get; init; }

    /// <summary>Phone number.</summary>
    public string? Phone { get; init; }

    /// <summary>URL of the user's profile photo.</summary>
    public string? Picture { get; init; }

    /// <summary>Azure B2C account ID, set only for Teams and PowerAutomate users.</summary>
    [JsonPropertyName("b2cId")]
    public string? B2CId { get; init; }

    /// <summary>Google account ID, set only for users signing in via Google.</summary>
    [JsonPropertyName("googleId")]
    public string? GoogleId { get; init; }

    /// <summary>Apple account ID, set only for users signing in via Apple.</summary>
    [JsonPropertyName("appleId")]
    public string? AppleId { get; init; }

    /// <summary>Github account ID, set only for users signing in via Github.</summary>
    [JsonPropertyName("githubId")]
    public string? GithubId { get; init; }

    /// <summary>True if the account is locked, typically after failed sign-in attempts. Visible to admins and owners.</summary>
    public bool? Locked { get; init; }

    /// <summary>Reason the account is locked. Visible to admins and owners.</summary>
    public string? LockReason { get; init; }

    /// <summary>Consecutive failed sign-in attempts. Visible to admins and owners.</summary>
    public int? LoginFailures { get; init; }

    /// <summary>The locale code.</summary>
    public string? Locale { get; init; }

    /// <summary>The long-form timezone.</summary>
    public string? Timezone { get; init; }

    /// <summary>
    /// False for accounts created through a social identity provider, which have no password
    /// set. Useful for gating password-reset controls in a UI. Sent only by GET /v2/users/me;
    /// null on user records embedded in other responses.
    /// </summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public bool? HasPassword { get; init; }

    /// <summary>
    /// When the password was last changed. Null if it never has been, and on user records
    /// embedded in other responses, which omit it.
    /// </summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public DateTimeOffset? PasswordChangedAt { get; init; }

    /// <summary>
    /// Linked social identity providers, if any; see <see cref="SignInProvider"/> for known
    /// values. Sent only by GET /v2/users/me; null on user records embedded in other responses.
    /// </summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyList<string>? SignInProviders { get; init; }

    /// <summary>
    /// The user's multi-factor authentication summary. Sent only by GET /v2/users/me; null on
    /// user records embedded in other responses.
    /// </summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public UserMfa? Mfa { get; init; }

    /// <summary>Creation date and time.</summary>
    public DateTimeOffset CreatedAt { get; init; }

    /// <summary>Last-update date and time.</summary>
    public DateTimeOffset UpdatedAt { get; init; }

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
