using Verdocs.Models;
using Verdocs.Utils;
using Xunit;

namespace Verdocs.Sdk.Tests;

/// <summary>
/// Country data and lookups (Verdocs.Utils.Locales). The table quirks asserted here (the
/// duplicate Martinique row, "+1" resolving to American Samoa, the Puerto Rico bug) are
/// ported behavior; if one of these tests starts failing, the js-sdk and this port have
/// drifted apart.
/// </summary>
public sealed class UtilsLocalesTests
{
    [Fact]
    public void Countries_MatchesJsSdk_CountAndEndpoints()
    {
        Assert.Equal(236, Locales.Countries.Count);
        Assert.Equal(new Country("+7 840", "Abkhazia", "+7"), Locales.Countries[0]);
        Assert.Equal(new Country("+263", "Zimbabwe", "+263"), Locales.Countries[^1]);
    }

    [Fact]
    public void Countries_KeepsJsQuirks_Verbatim()
    {
        // Martinique is listed twice, Saint Pierre has no "+", and the Reunion entry carries
        // the same escaped e-acute as the js-sdk source.
        Assert.Equal(2, Locales.Countries.Count(c => c.Name == "Martinique"));
        Assert.Contains(new Country("508", "Saint Pierre and Miquelon", "508"), Locales.Countries);
        Assert.Contains(Locales.Countries, c => c.Name == "Mayotte or R\u00e9union");
        Assert.Contains(new Country("+77", "Kazakhstan", "+7"), Locales.Countries);
    }

    [Fact]
    public void GetCountryByCode_ExactMatch_ReturnsCountry()
    {
        var country = Locales.GetCountryByCode("+44");
        Assert.NotNull(country);
        Assert.Equal("United Kingdom", country.Name);
    }

    [Fact]
    public void GetCountryByCode_SharedCode_ReturnsFirstTableRow()
    {
        // "+1" is shared by 25 rows; table order makes American Samoa win, so the United
        // States is never returned for "+1". Ported behavior.
        var country = Locales.GetCountryByCode("+1");
        Assert.NotNull(country);
        Assert.Equal("American Samoa", country.Name);
    }

    [Theory]
    [InlineData("+5941234", "French Guiana")]
    [InlineData("+5901234", "Guadeloupe")]
    [InlineData("+5961234", "Martinique")]
    [InlineData("+2621234", "Mayotte or R\u00e9union")]
    public void GetCountryByCode_FrenchTerritoryPrefix_FallsBack(string code, string name)
    {
        var country = Locales.GetCountryByCode(code);
        Assert.NotNull(country);
        Assert.Equal(name, country.Name);
    }

    [Fact]
    public void GetCountryByCode_UnknownCode_ReturnsNull()
    {
        Assert.Null(Locales.GetCountryByCode("nope"));
        Assert.Null(Locales.GetCountryByCode("+999"));
    }

    [Fact]
    public void PrefixHelpers_MatchTheirTerritories()
    {
        Assert.True(Locales.IsFrenchGuiana("+594123"));
        Assert.False(Locales.IsFrenchGuiana("+593123"));
        Assert.True(Locales.IsGuadeloupe("+590123"));
        Assert.True(Locales.IsMartinique("+596123"));
        Assert.True(Locales.IsMayotte("+262123"));
        Assert.False(Locales.IsMayotte("+261123"));

        // Shorter than the prefix window is fine; the JS substring clamp is reproduced.
        Assert.False(Locales.IsMayotte("+26"));
    }

    [Fact]
    public void GetPlusOneCountry_KnownPrefixes_ResolveTerritories()
    {
        Assert.Equal(new Country("+1", "American Samoa", "+1"), Locales.GetPlusOneCountry("+16845551212"));
        Assert.Equal(new Country("+1", "Bahamas", "+1"), Locales.GetPlusOneCountry("+12425551212"));

        // The bare "+1" arm produces an empty-named entry, as in the js-sdk switch.
        Assert.Equal(new Country("+1", "", "+1"), Locales.GetPlusOneCountry("+1"));

        // Five-character prefixes that name no territory produce nothing, even though
        // "+1999..." is still a NANP-shaped number.
        Assert.Null(Locales.GetPlusOneCountry("+19995551212"));
        Assert.Null(Locales.GetPlusOneCountry(""));
    }

    [Fact]
    public void IsCanada_CanadianAreaCodes_Match()
    {
        Assert.True(Locales.IsCanada("+14035551212"));
        Assert.True(Locales.IsCanada("+16475551212"));
        Assert.False(Locales.IsCanada("+12125551212"));
        Assert.False(Locales.IsCanada("+1"));
    }

    [Fact]
    public void IsAmericanSamoa_Prefix1684_Matches()
    {
        Assert.True(Locales.IsAmericanSamoa("+16845551212"));
        Assert.False(Locales.IsAmericanSamoa("+16855551212"));
    }

    [Fact]
    public void IsDominicanRepublic_ThreePrefixes_Match()
    {
        Assert.True(Locales.IsDominicanRepublic("+18095551212"));
        Assert.True(Locales.IsDominicanRepublic("+18295551212"));
        Assert.True(Locales.IsDominicanRepublic("+18495551212"));
        Assert.False(Locales.IsDominicanRepublic("+18085551212"));
    }

    [Fact]
    public void IsPuertoRico_PortedBug_OnlyLiteralPlusMatches()
    {
        // The js-sdk compares against "+" twice, so real PR prefixes never match. Kept
        // verbatim; these pins document the bug.
        Assert.True(Locales.IsPuertoRico("+"));
        Assert.False(Locales.IsPuertoRico("+17875551212"));
        Assert.False(Locales.IsPuertoRico("+19395551212"));
    }

    [Fact]
    public void GetMatchingCountry_ReturnsRowCounts()
    {
        // Returns a count, not a country (the js-sdk marks it "need to finish").
        Assert.Equal(1, Locales.GetMatchingCountry("+445551212", 3));
        Assert.Equal(25, Locales.GetMatchingCountry("+15551212", 2));

        // Duplicate Martinique rows both count.
        Assert.Equal(2, Locales.GetMatchingCountry("+5965551212", 4));
        Assert.Equal(0, Locales.GetMatchingCountry("+9995551212", 4));
    }
}
