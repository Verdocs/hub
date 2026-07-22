using System.Globalization;
using Verdocs.Utils;
using Xunit;

namespace Verdocs.Sdk.Tests;

/// <summary>
/// Short relative timestamps (Verdocs.Utils.Dates), pinned to the js-sdk Utils/DateTime.ts
/// output strings. Offsets sit safely inside their unit's range: the moments are built
/// microseconds before the call, so a boundary can only be crossed by a full second of delay
/// between the two.
/// </summary>
public sealed class UtilsDatesTests
{
    [Fact]
    public void FormatShortTimeAgo_NullMoment_ReturnsEmpty()
    {
        Assert.Equal("", Dates.FormatShortTimeAgo((DateTimeOffset?)null));
    }

    [Theory]
    [InlineData(5, "5S")]
    [InlineData(59, "59S")]
    [InlineData(90, "1M")]
    [InlineData(3540, "59M")]
    [InlineData(7200, "2H")]
    [InlineData(93600, "1D")]
    [InlineData(518400, "6D")]
    [InlineData(604800, "1W")]
    // No month unit (commented out in the js-sdk), so weeks run up to a year.
    [InlineData(2592000, "4W")]
    [InlineData(31449600, "52W")]
    [InlineData(34560000, "1Y")]
    [InlineData(69120000, "2Y")]
    public void FormatShortTimeAgo_UnitLadder_MatchesJsSdk(long secondsAgo, string expected)
    {
        Assert.Equal(expected, Dates.FormatShortTimeAgo(DateTimeOffset.UtcNow.AddSeconds(-secondsAgo)));
    }

    [Fact]
    public void FormatShortTimeAgo_JustNow_IsZeroSeconds()
    {
        Assert.Equal("0S", Dates.FormatShortTimeAgo(DateTimeOffset.UtcNow));
    }

    [Fact]
    public void FormatShortTimeAgo_FutureMoment_GoesNegative()
    {
        // No guard in the js-sdk either; the count just goes negative.
        Assert.Equal("-5S", Dates.FormatShortTimeAgo(DateTimeOffset.UtcNow.AddSeconds(5)));
    }

    [Fact]
    public void FormatShortTimeAgo_IsoStringWithZSuffix_Parses()
    {
        var value = DateTimeOffset.UtcNow.AddHours(-2).UtcDateTime.ToString("o", CultureInfo.InvariantCulture);
        Assert.EndsWith("Z", value, StringComparison.Ordinal);
        Assert.Equal("2H", Dates.FormatShortTimeAgo(value));
    }

    [Fact]
    public void FormatShortTimeAgo_IsoStringWithOffset_Parses()
    {
        var value = DateTimeOffset.Now.AddDays(-3).ToString("o", CultureInfo.InvariantCulture);
        Assert.Equal("3D", Dates.FormatShortTimeAgo(value));
    }

    [Fact]
    public void FormatShortTimeAgo_EpochMilliseconds_Parses()
    {
        Assert.Equal("3D", Dates.FormatShortTimeAgo(DateTimeOffset.UtcNow.AddDays(-3).ToUnixTimeMilliseconds()));
    }

    [Fact]
    public void FormatShortTimeAgo_UnparseableString_ReturnsEmpty()
    {
        // Adapted: the js-sdk builds an Invalid Date here and renders "NaNS".
        Assert.Equal("", Dates.FormatShortTimeAgo("not a date"));
    }

    [Fact]
    public void FormatShortTimeAgo_NullString_ReturnsEmpty()
    {
        Assert.Equal("", Dates.FormatShortTimeAgo((string?)null));
    }
}
