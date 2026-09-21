using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// The server-side record of one login session. Distinct from <see cref="VerdocsSession"/>,
/// which is the client-side decode of the token an endpoint currently holds.
/// </summary>
public sealed record UserLoginSession
{
    /// <summary>The unique ID of the session. Matches the sid claim of tokens issued for it.</summary>
    public string Id { get; init; } = null!;

    /// <summary>True for the session making the request. Offer sign-out rather than revocation for this one.</summary>
    public bool Current { get; init; }

    /// <summary>
    /// How the session was created. Typically a <see cref="SignInProvider"/> value, but typed
    /// as a string to allow patterns such as "oauth2:CLIENTID".
    /// </summary>
    public string Source { get; init; } = null!;

    /// <summary>When the session was created.</summary>
    public DateTimeOffset CreatedAt { get; init; }

    /// <summary>When the session was last used.</summary>
    public DateTimeOffset LastSeenAt { get; init; }

    /// <summary>
    /// Browser name. The full User-Agent is never stored (so it cannot be reused in replay
    /// attacks); only the browser name, platform, and desktop-or-mobile are tracked.
    /// </summary>
    public string? Browser { get; init; }

    /// <summary>Operating system or platform name.</summary>
    public string? Platform { get; init; }

    /// <summary>True when the session was created from a mobile device.</summary>
    public bool Mobile { get; init; }

    /// <summary>Approximate location (city, state, country). Fine-grained location data is not tracked.</summary>
    public string? Location { get; init; }

    /// <summary>
    /// Partially masked IP address the session was created from, for example "73.***.***.14".
    /// Full IP addresses are tracked and stored internally per the Verdocs Privacy Policy and
    /// EULA; they are masked in this record because these sessions may or may not be signing
    /// documents, and a full IP is not needed here.
    /// </summary>
    public string? IpAddress { get; init; }

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
