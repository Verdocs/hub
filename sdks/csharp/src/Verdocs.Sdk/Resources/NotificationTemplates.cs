using Verdocs.Models;

namespace Verdocs.Resources;

/// <summary>
/// Notification template calls, reached through the endpoint's NotificationTemplates
/// property. Notification templates customize the email and SMS messages sent during signing
/// workflows, keyed by channel type and event name. Every call requires the caller to be an
/// admin of the organization.
/// </summary>
public sealed class NotificationTemplates
{
    private readonly VerdocsEndpoint _endpoint;

    internal NotificationTemplates(VerdocsEndpoint endpoint)
    {
        _endpoint = endpoint;
    }

    /// <summary>
    /// Gets the notification templates for the caller's organization. The list omits the
    /// HTML and text bodies; call <see cref="GetAsync"/> for a template's content.
    ///
    /// <example>
    /// <code>
    /// var templates = await endpoint.NotificationTemplates.ListAsync();
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The organization's notification templates, without message bodies.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the caller is not an admin.</exception>
    /// <sdkOperation>notification.getNotificationTemplates</sdkOperation>
    /// <sdkGroup>Notification</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public async Task<IReadOnlyList<NotificationTemplate>> ListAsync(CancellationToken cancellationToken = default)
    {
        return await _endpoint.SendAsync<List<NotificationTemplate>>(
                HttpMethod.Get, "/v2/notifications/templates", null, cancellationToken)
            .ConfigureAwait(false);
    }

    /// <summary>
    /// Gets one notification template by its ID, including its message bodies.
    ///
    /// <example>
    /// <code>
    /// var template = await endpoint.NotificationTemplates.GetAsync("d2338742-f3a1-465b-8592-806587413cc1");
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="templateId">The notification template's unique ID.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The requested notification template.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the template was not found.</exception>
    /// <sdkOperation>notification.getNotificationTemplate</sdkOperation>
    /// <sdkGroup>Notification</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<NotificationTemplate> GetAsync(string templateId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(templateId);
        return _endpoint.SendAsync<NotificationTemplate>(
            HttpMethod.Get, "/v2/notifications/templates/" + Uri.EscapeDataString(templateId), null, cancellationToken);
    }

    /// <summary>
    /// Creates a notification template. Only one may exist per combination of type, event
    /// name, and scoped document template. The server validates that the bodies include the
    /// event's required variables, and may attach non-blocking warnings and an HTML quality
    /// score, which arrive in the result's AdditionalData.
    ///
    /// <example>
    /// <code>
    /// var template = await endpoint.NotificationTemplates.CreateAsync(new CreateNotificationTemplateRequest
    /// {
    ///     Type = "email",
    ///     EventName = EventName.EnvelopeCompleted,
    ///     HtmlTemplate = "&lt;p&gt;Your document is complete.&lt;/p&gt;",
    /// });
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="request">Details for the new template.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The new notification template.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because a template already exists for the event.</exception>
    /// <sdkOperation>notification.createNotificationTemplate</sdkOperation>
    /// <sdkGroup>Notification</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<NotificationTemplate> CreateAsync(CreateNotificationTemplateRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        return _endpoint.SendAsync<NotificationTemplate>(
            HttpMethod.Post, "/v2/notifications/templates", request, cancellationToken);
    }

    /// <summary>
    /// Updates a notification template's message bodies. The server validates that the
    /// bodies include the event's required variables, and may attach non-blocking warnings
    /// and an HTML quality score, which arrive in the result's AdditionalData.
    ///
    /// <example>
    /// <code>
    /// var updated = await endpoint.NotificationTemplates.UpdateAsync(
    ///     "d2338742-f3a1-465b-8592-806587413cc1",
    ///     new UpdateNotificationTemplateRequest { HtmlTemplate = "&lt;p&gt;Updated message.&lt;/p&gt;" });
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="templateId">The notification template's unique ID.</param>
    /// <param name="request">The changes to apply.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The updated notification template.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because a required variable is missing.</exception>
    /// <sdkOperation>notification.updateNotificationTemplate</sdkOperation>
    /// <sdkGroup>Notification</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<NotificationTemplate> UpdateAsync(
        string templateId,
        UpdateNotificationTemplateRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(templateId);
        ArgumentNullException.ThrowIfNull(request);
        return _endpoint.SendAsync<NotificationTemplate>(
            HttpMethod.Patch, "/v2/notifications/templates/" + Uri.EscapeDataString(templateId), request, cancellationToken);
    }

    /// <summary>
    /// Deletes a notification template. The event reverts to the platform's default message.
    ///
    /// <example>
    /// <code>
    /// await endpoint.NotificationTemplates.DeleteAsync("d2338742-f3a1-465b-8592-806587413cc1");
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="templateId">The notification template's unique ID.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>A task that completes when the template is deleted.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the caller is not an admin.</exception>
    /// <sdkOperation>notification.deleteNotificationTemplate</sdkOperation>
    /// <sdkGroup>Notification</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task DeleteAsync(string templateId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(templateId);
        return _endpoint.SendVoidAsync(
            HttpMethod.Delete, "/v2/notifications/templates/" + Uri.EscapeDataString(templateId), null, cancellationToken);
    }
}
