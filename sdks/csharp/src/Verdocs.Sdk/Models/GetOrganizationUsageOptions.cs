namespace Verdocs.Models;

/// <summary>Filters for <see cref="Resources.Organizations.GetUsageAsync"/>.</summary>
public sealed record GetOrganizationUsageOptions
{
    /// <summary>Count usage on or after this instant. The server defaults to 90 days ago.</summary>
    public DateTimeOffset? StartDate { get; init; }

    /// <summary>Count usage on or before this instant. The server defaults to now.</summary>
    public DateTimeOffset? EndDate { get; init; }

    /// <summary>Count only one usage type; see <see cref="Verdocs.Models.UsageType"/> for known values.</summary>
    public string? UsageType { get; init; }
}
