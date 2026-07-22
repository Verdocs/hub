using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// The decoded payload of an OpenID Connect ID token issued by Verdocs (the id_token in
/// <see cref="AuthenticateResponse"/>). The SDK does not decode ID tokens itself; this type
/// describes the payload for callers that do.
/// </summary>
public sealed record IdToken
{
    /// <summary>The audience claim.</summary>
    public string Aud { get; init; } = null!;

    /// <summary>The issuer claim.</summary>
    public string Iss { get; init; } = null!;

    /// <summary>The subject claim: the Verdocs user ID.</summary>
    public string Sub { get; init; } = null!;

    /// <summary>Email address of the user.</summary>
    public string Email { get; init; } = null!;

    /// <summary>The organization of the profile the token was issued for.</summary>
    public string OrganizationId { get; init; } = null!;

    /// <summary>First name.</summary>
    public string FirstName { get; init; } = null!;

    /// <summary>Last name.</summary>
    public string LastName { get; init; } = null!;

    /// <summary>Phone number, or null if the profile has none.</summary>
    public string? Phone { get; init; }

    /// <summary>Claims the model does not declare (profile_id, iat, exp), preserved for callers that need them.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
