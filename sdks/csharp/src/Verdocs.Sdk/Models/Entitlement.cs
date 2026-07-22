using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>A product feature granted to an organization, with usage caps and a validity window.</summary>
public sealed record Entitlement
{
    /// <summary>The unique ID of the entitlement.</summary>
    public string Id { get; init; } = null!;

    /// <summary>The organization the entitlement belongs to.</summary>
    public string OrganizationId { get; init; } = null!;

    /// <summary>The granted feature; see <see cref="EntitlementFeature"/> for known values.</summary>
    public string Feature { get; init; } = null!;

    /// <summary>Contract reference the grant traces back to, if any.</summary>
    public string? ContractId { get; init; }

    /// <summary>Free-form notes about the grant.</summary>
    public string? Notes { get; init; }

    /// <summary>When the grant becomes active.</summary>
    public DateTimeOffset StartsAt { get; init; }

    /// <summary>When the grant expires.</summary>
    public DateTimeOffset EndsAt { get; init; }

    /// <summary>Maximum uses per month.</summary>
    public long MonthlyMax { get; init; }

    /// <summary>Maximum uses per year.</summary>
    public long YearlyMax { get; init; }

    /// <summary>Creation date and time.</summary>
    public DateTimeOffset CreatedAt { get; init; }

    /// <summary>The owning organization, when the API includes it.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public Organization? Organization { get; init; }

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
