using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>An organization's customized message template for one notification event.</summary>
public sealed record NotificationTemplate
{
    /// <summary>The unique ID of the notification template.</summary>
    public string Id { get; init; } = null!;

    /// <summary>The organization the notification template belongs to.</summary>
    public string OrganizationId { get; init; } = null!;

    /// <summary>Delivery channel; see <see cref="NotificationType"/> for known values.</summary>
    public string Type { get; init; } = null!;

    /// <summary>The event the template fires on; see <see cref="Verdocs.Models.EventName"/> for known values.</summary>
    public string EventName { get; init; } = null!;

    /// <summary>Document template the customization is scoped to, if any.</summary>
    public string? TemplateId { get; init; }

    /// <summary>HTML message body.</summary>
    public string? HtmlTemplate { get; init; }

    /// <summary>Plain-text message body.</summary>
    public string? TextTemplate { get; init; }

    /// <summary>The scoped document template, when the API includes it.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public Template? Template { get; init; }

    /// <summary>The owning organization, when the API includes it.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public Organization? Organization { get; init; }

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
