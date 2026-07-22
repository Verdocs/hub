using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// Configuration for <see cref="Resources.Webhooks.SetAsync"/>. An organization has a single
/// webhook configuration that cannot be deleted; disable deliveries by setting
/// <see cref="Active"/> to false or <see cref="Url"/> to an empty string.
/// </summary>
public sealed record SetWebhookRequest
{
    /// <summary>URL events are delivered to. Must be HTTPS; an empty string disables deliveries.</summary>
    public required string Url { get; init; }

    /// <summary>True to enable webhook deliveries.</summary>
    public required bool Active { get; init; }

    /// <summary>Event subscriptions keyed by event name; see <see cref="WebhookEvent"/> for the names.</summary>
    public required IReadOnlyDictionary<string, bool> Events { get; init; }

    /// <summary>How deliveries authenticate; see <see cref="WebhookAuthMethod"/> for known values. The js-sdk always sends this; the server treats it as optional.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? AuthMethod { get; init; }

    /// <summary>Client ID for the client_credentials auth method.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? ClientId { get; init; }

    /// <summary>Client secret for the client_credentials auth method.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? ClientSecret { get; init; }

    /// <summary>OAuth2 scope to request for the client_credentials auth method.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Scope { get; init; }

    /// <summary>Token endpoint used for the client_credentials auth method.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? TokenEndpoint { get; init; }
}
