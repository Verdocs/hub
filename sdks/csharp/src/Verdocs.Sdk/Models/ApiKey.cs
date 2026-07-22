using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>An API key for machine-to-machine access, acting as one profile.</summary>
public sealed record ApiKey
{
    /// <summary>The key's client ID.</summary>
    public string ClientId { get; init; } = null!;

    /// <summary>Display name for the key.</summary>
    public string Name { get; init; } = null!;

    /// <summary>The organization the key belongs to.</summary>
    public string OrganizationId { get; init; } = null!;

    /// <summary>The profile the key acts as.</summary>
    public string ProfileId { get; init; } = null!;

    /// <summary>True when the key has organization-wide admin rights.</summary>
    public bool GlobalAdmin { get; init; }

    /// <summary>The key's secret. Returned only when the key is created or rotated.</summary>
    public string? ClientSecret { get; init; }

    /// <summary>Access level; see <see cref="ApiKeyPermission"/> for known values.</summary>
    public string Permission { get; init; } = null!;

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
