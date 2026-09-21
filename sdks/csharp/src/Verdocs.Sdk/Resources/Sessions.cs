using Verdocs.Models;

namespace Verdocs.Resources;

/// <summary>
/// Login session calls, reached through <see cref="VerdocsEndpoint.Sessions"/>. These manage
/// the server-side records of where the caller is signed in, not the token the endpoint holds.
/// </summary>
public sealed class Sessions
{
    private readonly VerdocsEndpoint _endpoint;

    internal Sessions(VerdocsEndpoint endpoint)
    {
        _endpoint = endpoint;
    }

    /// <summary>
    /// Gets the caller's active login sessions, newest first. The session the caller is using
    /// to make the request has <see cref="UserLoginSession.Current"/> set, and should be
    /// offered sign-out rather than revocation in a UI.
    ///
    /// <example>
    /// <code>
    /// var sessions = await endpoint.Sessions.GetSessionsAsync();
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The caller's active sessions, newest first.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the session is invalid.</exception>
    /// <sdkOperation>session.getSessions</sdkOperation>
    /// <sdkGroup>Session</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public async Task<IReadOnlyList<UserLoginSession>> GetSessionsAsync(CancellationToken cancellationToken = default)
    {
        return await _endpoint.SendAsync<List<UserLoginSession>>(HttpMethod.Get, "/v2/users/sessions", null, cancellationToken)
            .ConfigureAwait(false);
    }

    /// <summary>
    /// Revokes one of the caller's login sessions. Tokens issued for that session stop working
    /// immediately. The caller's current session cannot be revoked this way.
    ///
    /// <example>
    /// <code>
    /// await endpoint.Sessions.RevokeSessionAsync("SESSIONID");
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="sessionId">The ID of the session to revoke. May not be the caller's current session.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>A task that completes when the session is revoked.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the session was not found or is the current one.</exception>
    /// <sdkOperation>session.revokeSession</sdkOperation>
    /// <sdkGroup>Session</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task RevokeSessionAsync(string sessionId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(sessionId);
        return _endpoint.SendVoidAsync(
            HttpMethod.Delete, "/v2/users/sessions/" + Uri.EscapeDataString(sessionId), null, cancellationToken);
    }

    /// <summary>
    /// Revokes every login session for the caller except the one making the request: the
    /// "sign out everywhere else" operation.
    ///
    /// <example>
    /// <code>
    /// var result = await endpoint.Sessions.RevokeOtherSessionsAsync();
    /// Console.WriteLine($"Revoked {result.Revoked} sessions");
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The number of sessions revoked.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the session is invalid.</exception>
    /// <sdkOperation>session.revokeOtherSessions</sdkOperation>
    /// <sdkGroup>Session</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<RevokeSessionsResponse> RevokeOtherSessionsAsync(CancellationToken cancellationToken = default)
    {
        return _endpoint.SendAsync<RevokeSessionsResponse>(HttpMethod.Delete, "/v2/users/sessions", null, cancellationToken);
    }
}
