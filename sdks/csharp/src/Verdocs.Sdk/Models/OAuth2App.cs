using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>An OAuth2 application registered by an organization for delegated access.</summary>
public sealed record OAuth2App
{
    /// <summary>The unique ID of the application.</summary>
    public string Id { get; init; } = null!;

    /// <summary>The profile that registered the application.</summary>
    public string ProfileId { get; init; } = null!;

    /// <summary>The organization the application belongs to.</summary>
    public string OrganizationId { get; init; } = null!;

    /// <summary>Internal name for the application.</summary>
    public string Name { get; init; } = null!;

    /// <summary>The application's OAuth2 client ID.</summary>
    public string ClientId { get; init; } = null!;

    /// <summary>The application's secret. Returned only when the application is created or rotated.</summary>
    public string? ClientSecret { get; init; }

    /// <summary>Allowed redirect URIs, comma separated.</summary>
    public string RedirectUris { get; init; } = null!;

    /// <summary>Allowed browser origins, comma separated.</summary>
    public string Origins { get; init; } = null!;

    /// <summary>Name shown to end users on consent screens.</summary>
    public string FriendlyName { get; init; } = null!;

    /// <summary>Logo shown to end users on consent screens.</summary>
    public string LogoUri { get; init; } = null!;

    /// <summary>Public key for verifying tokens issued to the application.</summary>
    public string PublicKey { get; init; } = null!;

    /// <summary>Private key material held for the application.</summary>
    public string PrivateKey { get; init; } = null!;

    /// <summary>Creation date and time.</summary>
    public DateTimeOffset CreatedAt { get; init; }

    /// <summary>Last-update date and time.</summary>
    public DateTimeOffset UpdatedAt { get; init; }

    /// <summary>The owning organization, when the API includes it.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public Organization? Organization { get; init; }

    /// <summary>The registering profile, when the API includes it.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public Profile? Profile { get; init; }

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
