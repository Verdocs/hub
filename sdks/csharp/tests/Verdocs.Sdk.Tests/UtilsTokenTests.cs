using System.Text;
using System.Text.Json;
using Verdocs.Utils;
using Xunit;

namespace Verdocs.Sdk.Tests;

/// <summary>JWT body decoding (Verdocs.Utils.Token).</summary>
public sealed class UtilsTokenTests
{
    [Fact]
    public void DecodeJwtBody_UserToken_ReadsClaims()
    {
        var claims = Token.DecodeJwtBody(TestTokens.Create());
        Assert.Equal("user-1234", claims.GetProperty("sub").GetString());
        Assert.Equal("user", claims.GetProperty("session_type").GetString());
    }

    [Fact]
    public void DecodeJwtBody_NoPayloadSegment_ThrowsJsonException()
    {
        // The js-sdk throws here too (JSON.parse on an empty decode).
        Assert.Throws<JsonException>(() => Token.DecodeJwtBody("garbage"));
        Assert.Throws<JsonException>(() => Token.DecodeJwtBody(""));
        Assert.Throws<JsonException>(() => Token.DecodeJwtBody(null));
    }

    [Fact]
    public void DecodeJwtBody_NonBase64Payload_ThrowsFormatException()
    {
        Assert.Throws<FormatException>(() => Token.DecodeJwtBody("still.not-json!.x"));
    }

    [Fact]
    public void DecodeJwtBody_Base64UrlPayload_Decodes()
    {
        // JWT segments are base64url. ASCII-only JSON never produces "-" or "_", but
        // non-ASCII claims do; the js-sdk's AtoB only speaks the standard alphabet and throws
        // on this token, while we decode it (flagged in the parity drop).
        var payload = Base64UrlEncode("{\"name\": \"\u00be\"}");
        Assert.True(payload.Contains('-') || payload.Contains('_'));

        var claims = Token.DecodeJwtBody("header." + payload + ".signature");
        Assert.Equal("\u00be", claims.GetProperty("name").GetString());
    }

    [Fact]
    public void DecodeAccessTokenBody_UserToken_ReadsClaims()
    {
        var session = Token.DecodeAccessTokenBody(TestTokens.Create());
        Assert.NotNull(session);
        Assert.Equal(SessionType.User, session.SessionType);
        Assert.Equal("user-1234", session.Sub);
        Assert.Equal("test@example.com", session.Email);
        Assert.Equal("profile-1234", session.ProfileId);
        Assert.Equal("org-1234", session.OrganizationId);
        Assert.Null(session.EnvelopeId);
        Assert.NotNull(session.ExpiresAt);
    }

    [Fact]
    public void DecodeAccessTokenBody_SigningToken_ReadsClaims()
    {
        var session = Token.DecodeAccessTokenBody(TestTokens.Create("signing"));
        Assert.NotNull(session);
        Assert.Equal(SessionType.Signing, session.SessionType);
        Assert.Equal("envelope-1234", session.EnvelopeId);
        Assert.Equal("Recipient 1", session.RoleName);
        Assert.Null(session.OrganizationId);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("garbage")]
    // Stricter than js: exactly three segments required.
    [InlineData("one.two")]
    [InlineData("a.!!!.c")]
    public void DecodeAccessTokenBody_MalformedToken_ReturnsNull(string? badToken)
    {
        Assert.Null(Token.DecodeAccessTokenBody(badToken));
    }

    [Fact]
    public void DecodeAccessTokenBody_ArrayPayload_ReturnsNull()
    {
        // The payload must be an object, mirroring the Python port's strictness.
        Assert.Null(Token.DecodeAccessTokenBody("a." + Base64UrlEncode("[1, 2]") + ".c"));
    }

    [Fact]
    public void DecodeAccessTokenBody_NoSessionTypeClaim_ReturnsNull()
    {
        // Adapted: a JWT without a user/signing session_type is not a Verdocs access token,
        // so the typed decode answers null rather than inventing a session type.
        Assert.Null(Token.DecodeAccessTokenBody("a." + Base64UrlEncode("{\"sub\": \"x\"}") + ".c"));
    }

    private static string Base64UrlEncode(string json)
    {
        return Convert.ToBase64String(Encoding.UTF8.GetBytes(json))
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
    }
}
