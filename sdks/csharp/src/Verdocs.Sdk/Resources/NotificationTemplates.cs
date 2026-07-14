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
    /// </summary>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The organization's notification templates, without message bodies.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the caller is not an admin.</exception>
    public async Task<IReadOnlyList<NotificationTemplate>> ListAsync(CancellationToken cancellationToken = default)
    {
        return await _endpoint.SendAsync<List<NotificationTemplate>>(
                HttpMethod.Get, "/v2/notifications/templates", null, cancellationToken)
            .ConfigureAwait(false);
    }

    /// <summary>
    /// Gets one notification template by its ID, including its message bodies.
    /// </summary>
    /// <param name="templateId">The notification template's unique ID.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The requested notification template.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the template was not found.</exception>
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
    /// </summary>
    /// <param name="request">Details for the new template.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The new notification template.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because a template already exists for the event.</exception>
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
    /// </summary>
    /// <param name="templateId">The notification template's unique ID.</param>
    /// <param name="request">The changes to apply.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The updated notification template.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because a required variable is missing.</exception>
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
    /// </summary>
    /// <param name="templateId">The notification template's unique ID.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>A task that completes when the template is deleted.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the caller is not an admin.</exception>
    public Task DeleteAsync(string templateId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(templateId);
        return _endpoint.SendVoidAsync(
            HttpMethod.Delete, "/v2/notifications/templates/" + Uri.EscapeDataString(templateId), null, cancellationToken);
    }
}
