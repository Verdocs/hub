using Verdocs.Models;

namespace Verdocs.Resources;

/// <summary>
/// Organization group calls, reached through the endpoint's Groups property. Groups grant
/// blocks of permissions to their member profiles; permissions are additive across groups
/// and direct assignments. Any member may list groups, but only admins and owners may change
/// them. Every organization has a reserved "everyone" group that cannot be renamed or
/// deleted.
/// </summary>
public sealed class Groups
{
    private readonly VerdocsEndpoint _endpoint;

    internal Groups(VerdocsEndpoint endpoint)
    {
        _endpoint = endpoint;
    }

    /// <summary>
    /// Gets the groups in the caller's organization, without their membership lists; call
    /// <see cref="GetAsync"/> for a group's members.
    /// </summary>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The organization's groups.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the session is invalid.</exception>
    public async Task<IReadOnlyList<Group>> ListAsync(CancellationToken cancellationToken = default)
    {
        return await _endpoint.SendAsync<List<Group>>(HttpMethod.Get, "/v2/organization-groups", null, cancellationToken)
            .ConfigureAwait(false);
    }

    /// <summary>
    /// Gets one group with its permissions and membership entries.
    /// </summary>
    /// <param name="groupId">The group's unique ID.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The requested group.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the group was not found.</exception>
    public Task<Group> GetAsync(string groupId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(groupId);
        return _endpoint.SendAsync<Group>(
            HttpMethod.Get, "/v2/organization-groups/" + Uri.EscapeDataString(groupId), null, cancellationToken);
    }

    /// <summary>
    /// Creates a group. The caller must be an admin; "everyone" is a reserved name.
    /// </summary>
    /// <param name="request">The new group's name and permissions.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The new group.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the name is reserved.</exception>
    public Task<Group> CreateAsync(CreateGroupRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        return _endpoint.SendAsync<Group>(HttpMethod.Post, "/v2/organization-groups", request, cancellationToken);
    }

    /// <summary>
    /// Updates a group's name and permissions. The caller must be an admin. Both fields are
    /// required and the permissions list replaces the previous one.
    /// </summary>
    /// <param name="groupId">The group's unique ID.</param>
    /// <param name="request">The replacement name and permissions.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The updated group.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the group is "everyone".</exception>
    public Task<Group> UpdateAsync(string groupId, UpdateGroupRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(groupId);
        ArgumentNullException.ThrowIfNull(request);
        return _endpoint.SendAsync<Group>(
            HttpMethod.Patch, "/v2/organization-groups/" + Uri.EscapeDataString(groupId), request, cancellationToken);
    }

    /// <summary>
    /// Deletes a group and its membership entries. The caller must be an admin; the
    /// "everyone" group cannot be deleted.
    /// </summary>
    /// <param name="groupId">The group's unique ID.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>A task that completes when the group is deleted.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the group is "everyone".</exception>
    public Task DeleteAsync(string groupId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(groupId);
        return _endpoint.SendVoidAsync(
            HttpMethod.Delete, "/v2/organization-groups/" + Uri.EscapeDataString(groupId), null, cancellationToken);
    }

    /// <summary>
    /// Adds a member to a group. The caller must be an admin and the profile must belong to
    /// the same organization. NOTE: the deployed handler validates the request and rejects
    /// duplicates, but it never actually creates the membership row and answers with an empty
    /// body, so this call is a no-op until the API is fixed.
    /// </summary>
    /// <param name="groupId">The group's unique ID.</param>
    /// <param name="profileId">The profile to add.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>A task that completes when the server accepts the request.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the profile is already a member.</exception>
    public Task AddMemberAsync(string groupId, string profileId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(groupId);
        ArgumentException.ThrowIfNullOrEmpty(profileId);
        return _endpoint.SendVoidAsync(
            HttpMethod.Post,
            "/v2/organization-groups/" + Uri.EscapeDataString(groupId) + "/members",
            new { profile_id = profileId },
            cancellationToken);
    }

    /// <summary>
    /// Removes a member from a group. The caller must be an admin.
    /// </summary>
    /// <param name="groupId">The group's unique ID.</param>
    /// <param name="profileId">The profile to remove.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>A task that completes when the membership is removed.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the membership was not found.</exception>
    public Task DeleteMemberAsync(string groupId, string profileId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(groupId);
        ArgumentException.ThrowIfNullOrEmpty(profileId);
        return _endpoint.SendVoidAsync(
            HttpMethod.Delete,
            "/v2/organization-groups/" + Uri.EscapeDataString(groupId) + "/members/" + Uri.EscapeDataString(profileId),
            null,
            cancellationToken);
    }
}
