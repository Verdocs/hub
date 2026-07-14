using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// Details for <see cref="Resources.NotificationTemplates.CreateAsync"/>. At least one of
/// <see cref="HtmlTemplate"/> or <see cref="TextTemplate"/> is required.
/// </summary>
public sealed record CreateNotificationTemplateRequest
{
    /// <summary>The notification channel: "sms", "email", or "app".</summary>
    public required string Type { get; init; }

    /// <summary>The event that triggers the notification; see <see cref="Verdocs.Models.EventName"/> for known values.</summary>
    public required string EventName { get; init; }

    /// <summary>Scopes the customization to one document template. Omit to customize the event organization-wide.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? TemplateId { get; init; }

    /// <summary>HTML message body.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? HtmlTemplate { get; init; }

    /// <summary>Plain-text message body.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? TextTemplate { get; init; }
}
