using Verdocs.Models;

namespace Verdocs.Resources;

/// <summary>
/// Organization invitation calls, reached through the endpoint's Invitations property. An
/// invitation is a one-time offer for a person to join an organization; it is keyed by email
/// address and redeemed with the token from the invitation email.
/// </summary>
public sealed class Invitations
{
    private readonly VerdocsEndpoint _endpoint;

    internal Invitations(VerdocsEndpoint endpoint)
    {
        _endpoint = endpoint;
    }

    /// <summary>
    /// Gets the invitations pending for the caller's organization, sorted by email.
    /// </summary>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The organization's pending invitations.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the session is invalid.</exception>
    public async Task<IReadOnlyList<OrganizationInvitation>> ListAsync(CancellationToken cancellationToken = default)
    {
        return await _endpoint.SendAsync<List<OrganizationInvitation>>(
                HttpMethod.Get, "/v2/organization-invitations", null, cancellationToken)
            .ConfigureAwait(false);
    }

    /// <summary>
    /// Invites a person to join the organization and emails them the invitation. The caller
    /// must be an admin. Fails when an invitation or profile already exists for the email.
    /// </summary>
    /// <param name="request">Details for the invitation.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The new invitation.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because an invitation already exists for the email.</exception>
    public Task<OrganizationInvitation> CreateAsync(CreateInvitationRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        return _endpoint.SendAsync<OrganizationInvitation>(
            HttpMethod.Post, "/v2/organization-invitations", request, cancellationToken);
    }

    /// <summary>
    /// Deletes a pending invitation. No cancellation message is sent, and the invitee sees an
    /// error if they later try to accept. This also removes any profile rows for that email
    /// in the caller's organization.
    /// </summary>
    /// <param name="email">The invitee's email address.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>A task that completes when the invitation is deleted.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the caller is not an admin.</exception>
    public Task DeleteAsync(string email, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(email);
        return _endpoint.SendVoidAsync(
            HttpMethod.Delete, "/v2/organization-invitations/" + Uri.EscapeDataString(email), null, cancellationToken);
    }

    /// <summary>
    /// Updates a pending invitation's role. The email cannot be changed; delete and re-create
    /// the invitation instead. The js-sdk also sends the names, but the deployed API's strict
    /// schema accepts the role alone. NOTE: the deployed handler's existence check is
    /// inverted, so updating an invitation that exists currently fails with a 400 ("An
    /// invitation already exists for this email") until the API is fixed.
    /// </summary>
    /// <param name="email">The invitee's email address.</param>
    /// <param name="role">The role the invitee will hold: "contact", "basic_user", "member", "admin", or "owner".</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>A task that completes when the server accepts the request.</returns>
    /// <exception cref="VerdocsApiException">The call failed; see the note above about the deployed handler.</exception>
    public Task UpdateAsync(string email, string role, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(email);
        ArgumentException.ThrowIfNullOrEmpty(role);
        return _endpoint.SendVoidAsync(
            HttpMethod.Patch, "/v2/organization-invitations/" + Uri.EscapeDataString(email), new { role }, cancellationToken);
    }

    /// <summary>
    /// Re-sends the invitation email to a pending invitee. Declined invitations cannot be
    /// re-sent. The js-sdk types the response as the invitation, but the server answers with
    /// a status marker only, so nothing is returned here.
    /// </summary>
    /// <param name="email">The invitee's email address.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>A task that completes when the reminder is sent.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the invitation was declined.</exception>
    public Task ResendAsync(string email, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(email);
        return _endpoint.SendVoidAsync(
            HttpMethod.Post, "/v2/organization-invitations/resend", new { email }, cancellationToken);
    }

    /// <summary>
    /// Gets an invitation's details, typically as the first step of accepting it. The call is
    /// authenticated by the invite token rather than a session, and a successful response
    /// means the token is still valid. Includes the organization's summary details for
    /// branding the acceptance screen.
    /// </summary>
    /// <param name="email">The invitee's email address.</param>
    /// <param name="token">The invite token from the invitation email.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The invitation, with its organization.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the token is invalid.</exception>
    public Task<OrganizationInvitation> GetAsync(string email, string token, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(email);
        ArgumentException.ThrowIfNullOrEmpty(token);
        return _endpoint.SendAsync<OrganizationInvitation>(
            HttpMethod.Get,
            "/v2/organization-invitations/" + Uri.EscapeDataString(email) + "/" + Uri.EscapeDataString(token),
            null,
            cancellationToken);
    }

    /// <summary>
    /// Accepts an invitation. Creates a user for the invitee when needed, creates a profile
    /// with the invited role and makes it current, and returns session tokens for it; apply
    /// them with <see cref="VerdocsEndpoint.SetToken"/>.
    /// </summary>
    /// <param name="request">The acceptance details.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>Session tokens for the new profile.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the invitation was declined.</exception>
    public Task<AuthenticateResponse> AcceptAsync(AcceptOrganizationInvitationRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        return _endpoint.SendAsync<AuthenticateResponse>(
            HttpMethod.Post, "/v2/organization-invitations/accept", request, cancellationToken);
    }

    /// <summary>
    /// Declines an invitation. The status becomes "declined", which shows the organization's
    /// admins the invite was refused, blocks further invitations to the email, and stops
    /// reminder emails.
    /// </summary>
    /// <param name="email">The invitee's email address.</param>
    /// <param name="token">The invite token from the invitation email.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>A task that completes when the invitation is declined.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the token is invalid.</exception>
    public Task DeclineAsync(string email, string token, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(email);
        ArgumentException.ThrowIfNullOrEmpty(token);
        return _endpoint.SendVoidAsync(
            HttpMethod.Post, "/v2/organization-invitations/decline", new { email, token }, cancellationToken);
    }
}
