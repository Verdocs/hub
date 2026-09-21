using System.Text.RegularExpressions;
using Verdocs.Utils;
using Xunit;

namespace Verdocs.Sdk.Tests;

/// <summary>PKCE verifier and challenge helpers (Verdocs.Utils.Pkce).</summary>
public sealed partial class PkceTests
{
    [Fact]
    public void CreateCodeVerifier_Returns43UrlSafeChars()
    {
        var verifier = Pkce.CreateCodeVerifier();

        // 32 random bytes base64url-encode to exactly 43 characters with no padding.
        Assert.Equal(43, verifier.Length);
        Assert.Matches(UrlSafePattern(), verifier);
    }

    [Fact]
    public void CreateCodeVerifier_CalledTwice_ReturnsDifferentValues()
    {
        Assert.NotEqual(Pkce.CreateCodeVerifier(), Pkce.CreateCodeVerifier());
    }

    [Fact]
    public void CreateCodeChallenge_Rfc7636Example_MatchesKnownChallenge()
    {
        // Appendix B of RFC 7636.
        var challenge = Pkce.CreateCodeChallenge("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk");

        Assert.Equal("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM", challenge);
    }

    [Fact]
    public void CreateCodeChallenge_GeneratedVerifier_IsUnpaddedUrlSafe()
    {
        var challenge = Pkce.CreateCodeChallenge(Pkce.CreateCodeVerifier());

        Assert.Equal(43, challenge.Length);
        Assert.Matches(UrlSafePattern(), challenge);
    }

    [Fact]
    public void CreateCodeChallenge_EmptyVerifier_Throws()
    {
        Assert.Throws<ArgumentException>(() => Pkce.CreateCodeChallenge(""));
        Assert.Throws<ArgumentNullException>(() => Pkce.CreateCodeChallenge(null!));
    }

    [GeneratedRegex("^[A-Za-z0-9_-]+$")]
    private static partial Regex UrlSafePattern();
}
