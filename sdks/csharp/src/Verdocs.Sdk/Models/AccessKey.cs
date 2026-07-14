using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// A key granting access to an envelope. The js-sdk models this as four interfaces (in-person,
/// in-app, email, and SMS keys) that differ only in the type discriminator and whether the
/// party is named by role_name or recipient_name; C# has no discriminated unions, so one record
/// covers all four and <see cref="Type"/> discriminates.
/// </summary>
public sealed record AccessKey
{
    /// <summary>The unique ID of the access key.</summary>
    public string Id { get; init; } = null!;

    /// <summary>How the key was issued; see <see cref="AccessKeyType"/> for known values.</summary>
    public string Type { get; init; } = null!;

    /// <summary>Authentication level attached to the key, if any.</summary>
    public string? Authentication { get; init; }

    /// <summary>The role the key admits. Set for in-person link keys.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? RoleName { get; init; }

    /// <summary>The recipient the key admits. Set for in-app, email, and SMS keys.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? RecipientName { get; init; }

    /// <summary>The envelope the key grants access to.</summary>
    public string EnvelopeId { get; init; } = null!;

    /// <summary>The key value itself.</summary>
    public string Key { get; init; } = null!;

    /// <summary>When the key expires, or null if it does not.</summary>
    public DateTimeOffset? ExpirationDate { get; init; }

    /// <summary>Creation date and time.</summary>
    public DateTimeOffset CreatedAt { get; init; }

    /// <summary>When the key was first used, or null if never.</summary>
    public DateTimeOffset? FirstUsed { get; init; }

    /// <summary>When the key was last used, or null if never.</summary>
    public DateTimeOffset? LastUsed { get; init; }

    /// <summary>The envelope, when the API includes it.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public Envelope? Envelope { get; init; }

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
