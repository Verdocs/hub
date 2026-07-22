using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// Changes for <see cref="Resources.NotificationTemplates.UpdateAsync"/>. At least one of
/// <see cref="HtmlTemplate"/> or <see cref="TextTemplate"/> is required.
/// </summary>
public sealed record UpdateNotificationTemplateRequest
{
    /// <summary>HTML message body.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? HtmlTemplate { get; init; }

    /// <summary>Plain-text message body.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? TextTemplate { get; init; }
}
