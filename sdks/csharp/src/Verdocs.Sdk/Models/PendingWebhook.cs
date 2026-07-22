using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>One webhook delivery, queued or already attempted.</summary>
public sealed record PendingWebhook
{
    /// <summary>The unique ID of the delivery.</summary>
    public string Id { get; init; } = null!;

    /// <summary>The webhook the delivery belongs to.</summary>
    public string WebhookId { get; init; } = null!;

    /// <summary>The organization the webhook belongs to.</summary>
    public string OrganizationId { get; init; } = null!;

    /// <summary>The URL the delivery goes to.</summary>
    public string Url { get; init; } = null!;

    /// <summary>The event payload being delivered.</summary>
    public JsonElement? Body { get; init; }

    /// <summary>Creation date and time.</summary>
    public DateTimeOffset CreatedAt { get; init; }

    /// <summary>When the delivery succeeded, or null while it is still pending.</summary>
    public DateTimeOffset? DeliveredAt { get; init; }

    /// <summary>When delivery was last attempted.</summary>
    public DateTimeOffset? LastAttemptAt { get; init; }

    /// <summary>HTTP status code of the last attempt.</summary>
    public int? LastStatus { get; init; }

    /// <summary>Response body or error from the last attempt.</summary>
    public string? LastResult { get; init; }

    /// <summary>The owning webhook, when the API includes it.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public Webhook? Webhook { get; init; }

    /// <summary>The owning organization, when the API includes it.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public Organization? Organization { get; init; }

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
