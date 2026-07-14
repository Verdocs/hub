using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>An outbound webhook subscription for an organization's events.</summary>
public sealed record Webhook
{
    /// <summary>The unique ID of the webhook.</summary>
    public string Id { get; init; } = null!;

    /// <summary>The organization the webhook belongs to.</summary>
    public string OrganizationId { get; init; } = null!;

    /// <summary>The URL events are delivered to.</summary>
    public string Url { get; init; } = null!;

    /// <summary>Secret used for HMAC signing, when that auth method is selected.</summary>
    public string? SecretKey { get; init; }

    /// <summary>Client ID for the client-credentials auth method.</summary>
    public string? ClientId { get; init; }

    /// <summary>Client secret for the client-credentials auth method.</summary>
    public string? ClientSecret { get; init; }

    /// <summary>OAuth2 scope requested for the client-credentials auth method.</summary>
    public string? Scope { get; init; }

    /// <summary>Token endpoint used for the client-credentials auth method.</summary>
    public string? TokenEndpoint { get; init; }

    /// <summary>How deliveries authenticate; see <see cref="WebhookAuthMethod"/> for known values.</summary>
    public string AuthMethod { get; init; } = null!;

    /// <summary>True while the webhook is enabled.</summary>
    public bool Active { get; init; }

    /// <summary>Event subscriptions keyed by event name; see <see cref="WebhookEvent"/> for the names.</summary>
    public IReadOnlyDictionary<string, bool> Events { get; init; } = new Dictionary<string, bool>();

    /// <summary>Free-form delivery health status.</summary>
    public string? Status { get; init; }

    /// <summary>When a delivery last succeeded.</summary>
    public DateTimeOffset? LastSuccess { get; init; }

    /// <summary>When a delivery last failed.</summary>
    public DateTimeOffset? LastFailure { get; init; }

    /// <summary>The owning organization, when the API includes it.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public Organization? Organization { get; init; }

    /// <summary>Undelivered or recently attempted events, when the API includes them.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyList<PendingWebhook>? PendingWebhooks { get; init; }

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
