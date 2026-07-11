using System.Text.Json;

namespace Verdocs;

/// <summary>
/// Decodes JWT payloads for session metadata. The SDK never verifies signatures; tokens are
/// decoded only so the endpoint can expose session details and drop obviously expired tokens.
/// </summary>
internal static class TokenParser
{
    /// <summary>Parses the payload segment of a JWT, or returns null if it is not one.</summary>
    internal static SessionClaims? TryParse(string token)
    {
        var parts = token.Split('.');
        if (parts.Length != 3)
        {
            return null;
        }

        try
        {
            // Base64Url by hand: the helper type for this is .NET 9+ and we target net8.0.
            var payload = parts[1].Replace('-', '+').Replace('_', '/');
            var padded = payload.PadRight(payload.Length + ((4 - (payload.Length % 4)) % 4), '=');
            var bytes = Convert.FromBase64String(padded);
            return JsonSerializer.Deserialize<SessionClaims>(bytes, VerdocsJson.Options);
        }
        catch (Exception exception) when (exception is FormatException or JsonException)
        {
            return null;
        }
    }
}
