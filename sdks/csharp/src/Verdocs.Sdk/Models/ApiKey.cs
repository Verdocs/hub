using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>An API key for machine-to-machine access, acting as one profile.</summary>
public sealed record ApiKey
{
    /// <summary>Display name for the key. Only used for identification.</summary>
    public string Name { get; init; } = null!;

    /// <summary>The organization the key belongs to.</summary>
    public string OrganizationId { get; init; } = null!;

    /// <summary>The profile the key acts as. Ignored when <see cref="GlobalAdmin"/> is set.</summary>
    public string ProfileId { get; init; } = null!;

    /// <summary>True when the key has full access to the organization, overriding the permissions of its assigned profile.</summary>
    public bool GlobalAdmin { get; init; }

    /// <summary>The key's client ID.</summary>
    public string ClientId { get; init; } = null!;

    /// <summary>The key's secret. Returned only when the key is created or rotated.</summary>
    public string? ClientSecret { get; init; }

    /// <summary>When the key was created.</summary>
    public DateTimeOffset CreatedAt { get; init; }

    /// <summary>When the key was last used, or null if it never has been.</summary>
    public DateTimeOffset? LastUsedAt { get; init; }

    /// <summary>The profile the key acts as, when the API includes it.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public Profile? Profile { get; init; }

    /// <summary>The owning organization, when the API includes it.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public Organization? Organization { get; init; }

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
