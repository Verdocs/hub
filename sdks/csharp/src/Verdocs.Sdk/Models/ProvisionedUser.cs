using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>The user account behind a directly provisioned member; see <see cref="CreateMemberResponse"/>.</summary>
public sealed record ProvisionedUser
{
    /// <summary>The user's email address.</summary>
    public string Email { get; init; } = null!;

    /// <summary>True when the user account already existed before the member was provisioned.</summary>
    public bool Existed { get; init; }

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
