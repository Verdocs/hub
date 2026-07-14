using Verdocs.Models;
using Xunit;

namespace Verdocs.Sdk.Tests;

/// <summary>
/// Ports the js-sdk Organizations/Entitlements.spec.ts cases against
/// Verdocs.Utils.Entitlements. The sample windows are computed relative to now on purpose
/// (a weekend fix upstream): the spec must keep passing regardless of when it runs.
/// </summary>
public sealed class UtilsEntitlementsTests
{
    private static readonly DateTimeOffset Now = DateTimeOffset.UtcNow;
    private static readonly DateTimeOffset Yesterday = Now.AddDays(-1);
    private static readonly DateTimeOffset Tomorrow = Now.AddDays(1);
    private static readonly DateTimeOffset LastMonth = Now.AddDays(-30);
    private static readonly DateTimeOffset LastWeek = Now.AddDays(-7);

    private static readonly IReadOnlyList<Entitlement> SampleEntitlements =
    [
        Make(
            id: "eae89e66-83bc-44f7-bb35-a8ef55958b3e",
            feature: EntitlementFeature.KbaAuth,
            startsAt: Yesterday,
            endsAt: Tomorrow,
            notes: "Active kba_auth entitlement"),
        Make(
            id: "98e94415-90b9-4601-a7bf-6557c7f4d426",
            feature: EntitlementFeature.KbaAuth,
            startsAt: Yesterday,
            endsAt: Tomorrow,
            notes: "Second active kba_auth entitlement, should lose to the first"),
        Make(
            id: "c8127c99-be1c-4c4c-af52-cbaf220c4059",
            feature: EntitlementFeature.PasscodeAuth,
            startsAt: LastMonth,
            endsAt: LastWeek,
            notes: "Expired passcode_auth entitlement"),
    ];

    [Fact]
    public void CollapseEntitlements_OverlappingAndExpiredGrants_FirstActivePerFeatureWins()
    {
        var collapsed = Utils.Entitlements.CollapseEntitlements(SampleEntitlements);

        // One active entry per feature, first match wins, expired entries dropped.
        Assert.Equal(SampleEntitlements[0].Id, collapsed[EntitlementFeature.KbaAuth].Id);
        Assert.False(collapsed.ContainsKey(EntitlementFeature.PasscodeAuth));
        Assert.Single(collapsed);
    }

    [Fact]
    public void CollapseEntitlements_FutureWindow_IsDropped()
    {
        var upcoming = Make("future", EntitlementFeature.SmsAuth, Tomorrow, Now.AddDays(2), null);
        Assert.Empty(Utils.Entitlements.CollapseEntitlements([upcoming]));
    }

    [Fact]
    public void CollapseEntitlements_EmptyInput_ReturnsEmpty()
    {
        Assert.Empty(Utils.Entitlements.CollapseEntitlements([]));
    }

    [Fact]
    public void CollapseEntitlements_NullInput_Throws()
    {
        Assert.Throws<ArgumentNullException>(() => Utils.Entitlements.CollapseEntitlements(null!));
    }

    private static Entitlement Make(string id, string feature, DateTimeOffset startsAt, DateTimeOffset endsAt, string? notes)
    {
        return new Entitlement
        {
            Id = id,
            OrganizationId = "eae89e66-83bc-44f7-bb35-a8ef55958b3e",
            ContractId = "1234",
            Notes = notes,
            Feature = feature,
            MonthlyMax = -1,
            YearlyMax = 5000,
            StartsAt = startsAt,
            EndsAt = endsAt,
            CreatedAt = LastMonth,
        };
    }
}
