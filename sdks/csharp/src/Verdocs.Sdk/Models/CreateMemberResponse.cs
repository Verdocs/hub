using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// The result of provisioning a member directly. The js-sdk types this call as returning the
/// profile alone; the deployed API actually wraps it with the backing user account and, when
/// it generated one, the initial password.
/// </summary>
public sealed record CreateMemberResponse
{
    /// <summary>The new member profile.</summary>
    public Profile Profile { get; init; } = null!;

    /// <summary>The user account backing the profile, which may have existed already.</summary>
    public ProvisionedUser User { get; init; } = null!;

    /// <summary>The generated initial password. Present only when the server created the user and no password was supplied.</summary>
    public string? Password { get; init; }

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
