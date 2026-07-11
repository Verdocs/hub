using System.Text;
using System.Text.Json.Nodes;

namespace Verdocs.Sdk.Tests;

/// <summary>
/// Builds unsigned JWTs carrying the claims the SDK's decoder reads. The SDK never verifies
/// signatures, so a fake signature segment is enough. Claim names and values mirror the ones
/// the platform issues for each session type.
/// </summary>
public static class TestTokens
{
    /// <summary>Creates a token. Pass a negative offset for an expired token, or null for no exp claim.</summary>
    public static string Create(string sessionType = "user", long? expOffsetSeconds = 3600)
    {
        var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var claims = new JsonObject
        {
            ["sub"] = "user-1234",
            ["iat"] = now,
            ["session_type"] = sessionType,
            ["email"] = "test@example.com",
            ["profile_id"] = "profile-1234",
        };

        if (expOffsetSeconds is { } offset)
        {
            claims["exp"] = now + offset;
        }

        if (sessionType == "user")
        {
            claims["jti"] = "jti-1234";
            claims["organization_id"] = "org-1234";
            claims["global_admin"] = false;
        }
        else
        {
            claims["envelope_id"] = "envelope-1234";
            claims["role_name"] = "Recipient 1";
            claims["key_type"] = "email";
        }

        return Encode("""{"alg":"none","typ":"JWT"}""") + "." + Encode(claims.ToJsonString()) + ".signature";
    }

    private static string Encode(string json)
    {
        return Convert.ToBase64String(Encoding.UTF8.GetBytes(json))
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
    }
}
