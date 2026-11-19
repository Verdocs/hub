using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>The answer from <see cref="Resources.Clickwrap.CreateSessionAsync"/> when the person has something to accept.</summary>
public sealed record ClickwrapSessionCreated : ClickwrapSessionResult
{
    /// <summary>The session's ID.</summary>
    public string Id { get; init; } = null!;

    /// <summary>The session token for the component or hosted page. It's returned only here, so hand it to the browser now.</summary>
    public string Token { get; init; } = null!;

    /// <summary>When the token expires, an hour after it's created.</summary>
    public DateTimeOffset ExpiresAt { get; init; }

    /// <summary>The agreement keys that were requested.</summary>
    public IReadOnlyList<string> Agreements { get; init; } = [];

    /// <summary>The Verdocs hosted page for this session, to redirect the person to instead of embedding the component.</summary>
    public string HostedUrl { get; init; } = null!;

    /// <summary>The status of each requested agreement.</summary>
    public IReadOnlyList<ClickwrapStatus> Status { get; init; } = [];

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
