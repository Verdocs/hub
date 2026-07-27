using System.Text.Json;
using Verdocs.Models;

namespace Verdocs.Resources;

/// <summary>
/// User account calls, reached through <see cref="VerdocsEndpoint.Users"/>.
/// </summary>
public sealed class Users
{
    private readonly VerdocsEndpoint _endpoint;

    internal Users(VerdocsEndpoint endpoint)
    {
        _endpoint = endpoint;
    }

    /// <summary>Gets the caller's user record.
    ///
    /// <example>
    /// <code>
    /// var me = await endpoint.Users.GetMeAsync();
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The caller's user record.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the session is invalid.</exception>
    /// <sdkOperation>auth.getMyUser</sdkOperation>
    /// <sdkGroup>Auth</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<User> GetMeAsync(CancellationToken cancellationToken = default)
    {
        return _endpoint.SendAsync<User>(HttpMethod.Get, "/v2/users/me", null, cancellationToken);
    }

    /// <summary>
    /// Gets the caller's most recent in-app notifications. The API returns at most 20.
    ///
    /// <example>
    /// <code>
    /// var notifications = await endpoint.Users.GetNotificationsAsync();
    /// </code>
    /// </example>
    /// </summary>
    /// <remarks>
    /// The result is raw JSON on purpose: the deployed endpoint returns notification store
    /// rows whose field names do not match the js-sdk's published INotification shape
    /// (recipient and delivered rather than profile_id and read), so typing this as the
    /// SDK's <see cref="Notification"/> model would silently leave most of it unmapped. The
    /// js-sdk leaves this response untyped too. This firms up once the API and its published
    /// models agree.
    /// </remarks>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The raw JSON array of notification rows.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the session is invalid.</exception>
    /// <sdkOperation>notification.getNotifications</sdkOperation>
    /// <sdkGroup>Notification</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<JsonElement> GetNotificationsAsync(CancellationToken cancellationToken = default)
    {
        return _endpoint.SendAsync<JsonElement>(HttpMethod.Get, "/v2/notifications", null, cancellationToken);
    }
}
