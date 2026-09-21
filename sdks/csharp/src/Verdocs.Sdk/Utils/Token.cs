using System.Text.Json;

namespace Verdocs.Utils;

/// <summary>
/// JWT body decoding (js-sdk: Utils/Token.ts). The js-sdk also ships AtoB, a Node/browser-safe
/// atob() replacement; Convert.FromBase64String already covers that, so it has no port here.
/// The .NET path is in fact more capable: AtoB only speaks the standard alphabet, so the
/// js-sdk throws on base64url payload segments (the actual JWT encoding) whenever they contain
/// "-" or "_", while these helpers decode them.
/// </summary>
public static class Token
{
    /// <summary>
    /// Decodes the payload segment of a JWT without verifying the signature. Lets callers
    /// read claims (expiry, IDs, session type) without a JWT dependency. Only real JWTs work;
    /// opaque tokens throw, mirroring the js-sdk's throw. Use
    /// <see cref="DecodeAccessTokenBody"/> for the non-throwing form.
    ///
    /// <example>
    /// <code>
    /// var payload = Token.DecodeJwtBody(jwt);
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="token">The JWT; null is treated as empty.</param>
    /// <returns>The parsed payload, whatever JSON it holds.</returns>
    /// <exception cref="FormatException">The payload segment is not valid base64 or base64url.</exception>
    /// <exception cref="JsonException">The payload segment does not decode to JSON.</exception>
    /// <sdkOperation>token.decodeJWTBody</sdkOperation>
    /// <sdkGroup>Token</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
    public static JsonElement DecodeJwtBody(string? token)
    {
        var parts = (token ?? string.Empty).Split('.');
        var payload = parts.Length > 1 ? parts[1] : string.Empty;

        // Base64Url by hand, like TokenParser: the helper type for this is .NET 9+ and we
        // target net8.0.
        var standard = payload.Replace('-', '+').Replace('_', '/');
        var padded = standard.PadRight(standard.Length + ((4 - (standard.Length % 4)) % 4), '=');
        var bytes = Convert.FromBase64String(padded);
        return JsonSerializer.Deserialize<JsonElement>(bytes);
    }

    /// <summary>
    /// Decodes a Verdocs access token's claims, returning null for anything malformed. User
    /// and signing sessions have different claim sets; tell them apart by
    /// <see cref="VerdocsSession.SessionType"/> or by the claims only one carries
    /// (<see cref="VerdocsSession.EnvelopeId"/> appears only on signing tokens).
    /// <see cref="VerdocsEndpoint.SetToken"/> runs this same decode when it stores a token;
    /// this helper hands back the claims for callers inspecting a token directly, without
    /// checking expiry.
    ///
    /// <example>
    /// <code>
    /// var session = Token.DecodeAccessTokenBody(accessToken);
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="token">The access token; null is treated as empty.</param>
    /// <returns>
    /// The decoded session, or null. Stricter than the js-sdk: the token must have three
    /// segments, an object payload, and a user or signing session_type claim, where js
    /// accepts any segment count and any JSON type.
    /// </returns>
    /// <sdkOperation>token.decodeAccessTokenBody</sdkOperation>
    /// <sdkGroup>Token</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
    public static VerdocsSession? DecodeAccessTokenBody(string? token)
    {
        if (string.IsNullOrEmpty(token))
        {
            return null;
        }

        // TokenParser is the decoder SetToken already uses; we delegate so the two paths can
        // never disagree about what parses.
        var claims = TokenParser.TryParse(token);
        if (claims is null)
        {
            return null;
        }

        SessionType? sessionType = claims.SessionType switch
        {
            "user" => SessionType.User,
            "signing" => SessionType.Signing,
            _ => null,
        };
        if (sessionType is not { } resolvedType)
        {
            return null;
        }

        return new VerdocsSession
        {
            SessionType = resolvedType,
            Sub = claims.Sub,
            Sid = claims.Sid,
            Email = claims.Email,
            ProfileId = claims.ProfileId,
            OrganizationId = claims.OrganizationId,
            EnvelopeId = claims.EnvelopeId,
            RoleName = claims.RoleName,
            GlobalAdmin = claims.GlobalAdmin,
            IssuedAt = claims.Iat is { } iat ? DateTimeOffset.FromUnixTimeSeconds(iat) : null,
            ExpiresAt = claims.Exp is { } exp ? DateTimeOffset.FromUnixTimeSeconds(exp) : null,
        };
    }
}
