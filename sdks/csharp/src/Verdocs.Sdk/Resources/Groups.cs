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
    ///
    /// <example>
    /// <code>
    /// var groups = await endpoint.Groups.ListAsync();
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The organization's groups.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the session is invalid.</exception>
    /// <sdkOperation>group.getGroups</sdkOperation>
    /// <sdkGroup>Group</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public async Task<IReadOnlyList<Group>> ListAsync(CancellationToken cancellationToken = default)
    {
        return await _endpoint.SendAsync<List<Group>>(HttpMethod.Get, "/v2/organization-groups", null, cancellationToken)
            .ConfigureAwait(false);
    }

    /// <summary>
    /// Gets one group with its permissions and membership entries.
    ///
    /// <example>
    /// <code>
    /// var group = await endpoint.Groups.GetAsync("d2338742-f3a1-465b-8592-806587413cc1");
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="groupId">The group's unique ID.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The requested group.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the group was not found.</exception>
    /// <sdkOperation>group.getGroup</sdkOperation>
    /// <sdkGroup>Group</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<Group> GetAsync(string groupId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(groupId);
        return _endpoint.SendAsync<Group>(
            HttpMethod.Get, "/v2/organization-groups/" + Uri.EscapeDataString(groupId), null, cancellationToken);
    }

    /// <summary>
    /// Creates a group. The caller must be an admin; "everyone" is a reserved name.
    ///
    /// <example>
    /// <code>
    /// var group = await endpoint.Groups.CreateAsync(new CreateGroupRequest
    /// {
    ///     Name = "Sales",
    ///     Permissions = ["send_envelopes", "manage_templates"],
    /// });
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="request">The new group's name and permissions.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The new group.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the name is reserved.</exception>
    /// <sdkOperation>group.createGroup</sdkOperation>
    /// <sdkGroup>Group</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<Group> CreateAsync(CreateGroupRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        return _endpoint.SendAsync<Group>(HttpMethod.Post, "/v2/organization-groups", request, cancellationToken);
    }

    /// <summary>
    /// Updates a group's name and permissions. The caller must be an admin. Both fields are
    /// required and the permissions list replaces the previous one.
    ///
    /// <example>
    /// <code>
    /// var updated = await endpoint.Groups.UpdateAsync(
    ///     "d2338742-f3a1-465b-8592-806587413cc1",
    ///     new UpdateGroupRequest { Name = "Sales", Permissions = ["send_envelopes"] });
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="groupId">The group's unique ID.</param>
    /// <param name="request">The replacement name and permissions.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The updated group.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the group is "everyone".</exception>
    /// <sdkOperation>group.updateGroup</sdkOperation>
    /// <sdkGroup>Group</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
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
    ///
    /// <example>
    /// <code>
    /// await endpoint.Groups.DeleteAsync("d2338742-f3a1-465b-8592-806587413cc1");
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="groupId">The group's unique ID.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>A task that completes when the group is deleted.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the group is "everyone".</exception>
    /// <sdkOperation>group.deleteGroup</sdkOperation>
    /// <sdkGroup>Group</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
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
    ///
    /// <example>
    /// <code>
    /// await endpoint.Groups.AddMemberAsync(
    ///     "d2338742-f3a1-465b-8592-806587413cc1",
    ///     "b1f2e3d4-c5a6-478b-9012-345678901234");
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="groupId">The group's unique ID.</param>
    /// <param name="profileId">The profile to add.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>A task that completes when the server accepts the request.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the profile is already a member.</exception>
    /// <sdkOperation>group.addGroupMember</sdkOperation>
    /// <sdkGroup>Group</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
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
    ///
    /// <example>
    /// <code>
    /// await endpoint.Groups.DeleteMemberAsync(
    ///     "d2338742-f3a1-465b-8592-806587413cc1",
    ///     "b1f2e3d4-c5a6-478b-9012-345678901234");
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="groupId">The group's unique ID.</param>
    /// <param name="profileId">The profile to remove.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>A task that completes when the membership is removed.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the membership was not found.</exception>
    /// <sdkOperation>group.deleteGroupMember</sdkOperation>
    /// <sdkGroup>Group</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
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
