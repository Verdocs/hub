using Verdocs.Models;
using Verdocs.Utils;
using Xunit;

namespace Verdocs.Sdk.Tests;

/// <summary>
/// Name and sequence primitives (Verdocs.Utils.Primitives). The FormatFullName cases port
/// the js-sdk __tests__/Utils/Primitives.spec.ts.
/// </summary>
public sealed class UtilsPrimitivesTests
{
    [Fact]
    public void IntegerSequence_StartAndCount_ReturnsConsecutiveIntegers()
    {
        Assert.Equal([0, 1, 2, 3, 4], Primitives.IntegerSequence(0, 5));
        Assert.Equal([3, 4, 5, 6], Primitives.IntegerSequence(3, 4));
        Assert.Empty(Primitives.IntegerSequence(5, 0));
    }

    [Theory]
    [InlineData(null, null, "")]
    [InlineData("test", null, "Test")]
    [InlineData(null, "user", "User")]
    [InlineData("test", "user", "Test User")]
    public void FormatFullName_SpecCases_MatchJsSdk(string? firstName, string? lastName, string expected)
    {
        Assert.Equal(expected, Primitives.FormatFullName(firstName, lastName));
    }

    [Fact]
    public void FormatInitials_ProfileWithNames_ReturnsSpacedInitials()
    {
        var profile = new Profile { FirstName = "test", LastName = "user" };
        Assert.Equal("T U", Primitives.FormatInitials(profile));
    }

    [Fact]
    public void FormatInitials_NullProfile_ReturnsPlaceholder()
    {
        Assert.Equal("--", Primitives.FormatInitials(null));
    }

    [Theory]
    [InlineData("John Doe", "JD")]
    // A double space yields an empty word, which contributes nothing (in js, undefined joins
    // as "").
    [InlineData("John  Doe", "JD")]
    [InlineData("", "")]
    // No capitalization here, matching the js-sdk.
    [InlineData("jane ann doe", "jad")]
    public void FullNameToInitials_FullName_ReturnsFirstCharacters(string name, string expected)
    {
        Assert.Equal(expected, Primitives.FullNameToInitials(name));
    }
}
