using Verdocs.Models;

namespace Verdocs.Utils;

/// <summary>Entitlement collapsing (js-sdk: Utils/Entitlements.ts).</summary>
public static class Entitlements
{
    /// <summary>
    /// Collapses raw entitlement records down to the active one per feature. Only entries
    /// whose date window covers now survive, and the first record per feature wins, so
    /// presence of a key means the feature is currently enabled. This is the client-side twin
    /// of what <see cref="Resources.Organizations.GetActiveEntitlementsAsync"/> returns.
    /// </summary>
    /// <param name="entitlements">
    /// The raw records, e.g. from <see cref="Resources.Organizations.GetEntitlementsAsync"/>.
    /// </param>
    /// <returns>Feature name (see <see cref="EntitlementFeature"/>) to the entitlement record currently granting it.</returns>
    public static IReadOnlyDictionary<string, Entitlement> CollapseEntitlements(IEnumerable<Entitlement> entitlements)
    {
        ArgumentNullException.ThrowIfNull(entitlements);

        // Grants may overlap, so the first grant whose date window covers now wins for each
        // feature.
        var now = DateTimeOffset.UtcNow;
        var active = new Dictionary<string, Entitlement>();
        foreach (var entitlement in entitlements)
        {
            if (now >= entitlement.StartsAt && now <= entitlement.EndsAt)
            {
                active.TryAdd(entitlement.Feature, entitlement);
            }
        }

        return active;
    }
}
