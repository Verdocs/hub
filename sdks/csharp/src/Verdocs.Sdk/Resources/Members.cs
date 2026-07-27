using Verdocs.Models;

namespace Verdocs.Resources;

/// <summary>
/// Organization member calls, reached through the endpoint's Members property. A member is a
/// profile with access to the caller's organization; contacts (profiles without access) live
/// under the Contacts resource instead.
/// </summary>
public sealed class Members
{
    private readonly VerdocsEndpoint _endpoint;

    internal Members(VerdocsEndpoint endpoint)
    {
        _endpoint = endpoint;
    }

    /// <summary>
    /// Gets the members of the caller's organization, sorted by name. Admins and owners also
    /// receive each member's joined user record (for lock-state management); other callers
    /// get the plain profiles.
    ///
    /// <example>
    /// <code>
    /// var members = await endpoint.Members.ListAsync();
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The organization's member profiles.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the session is invalid.</exception>
    /// <sdkOperation>member.getOrganizationMembers</sdkOperation>
    /// <sdkGroup>Member</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public async Task<IReadOnlyList<Profile>> ListAsync(CancellationToken cancellationToken = default)
    {
        return await _endpoint.SendAsync<List<Profile>>(HttpMethod.Get, "/v2/organization-members", null, cancellationToken)
            .ConfigureAwait(false);
    }

    /// <summary>
    /// Provisions a member directly, bypassing the invitation flow. The caller must be an
    /// admin. When no user exists for the email, one is created with the supplied password,
    /// or with a generated password returned in the response.
    ///
    /// <example>
    /// <code>
    /// var created = await endpoint.Members.CreateAsync(new CreateMemberRequest
    /// {
    ///     Email = "new.member@example.com",
    ///     FirstName = "New",
    ///     LastName = "Member",
    ///     Roles = ["member"],
    /// });
    /// var initialPassword = created.Password;
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="request">Details for the new member.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The new profile, the backing user account, and a generated password when one was created.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the user is already a member.</exception>
    /// <sdkOperation>member.createOrganizationMember</sdkOperation>
    /// <sdkGroup>Member</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<CreateMemberResponse> CreateAsync(CreateMemberRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        return _endpoint.SendAsync<CreateMemberResponse>(HttpMethod.Post, "/v2/organization-members", request, cancellationToken);
    }

    /// <summary>
    /// Updates a member's roles. The caller must be an admin (an owner, to grant the owner
    /// role) and may not update their own profile here.
    ///
    /// <example>
    /// <code>
    /// var updated = await endpoint.Members.UpdateAsync(
    ///     "d2338742-f3a1-465b-8592-806587413cc1",
    ///     new UpdateMemberRequest { Roles = ["admin"] });
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="profileId">The member's profile ID.</param>
    /// <param name="request">The changes to apply.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The updated profile.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the caller targeted their own profile.</exception>
    /// <sdkOperation>member.updateOrganizationMember</sdkOperation>
    /// <sdkGroup>Member</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<Profile> UpdateAsync(string profileId, UpdateMemberRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(profileId);
        ArgumentNullException.ThrowIfNull(request);
        return _endpoint.SendAsync<Profile>(
            HttpMethod.Patch, "/v2/organization-members/" + Uri.EscapeDataString(profileId), request, cancellationToken);
    }

    /// <summary>
    /// Removes a member from the caller's organization. The caller must be an admin. The
    /// member's envelopes, recipient records, and templates are reassigned to the caller;
    /// their signatures, API keys, and group memberships are deleted.
    ///
    /// <example>
    /// <code>
    /// await endpoint.Members.DeleteAsync("d2338742-f3a1-465b-8592-806587413cc1");
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="profileId">The member's profile ID.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>A task that completes when the member is removed.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the profile was not found.</exception>
    /// <sdkOperation>member.deleteOrganizationMember</sdkOperation>
    /// <sdkGroup>Member</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task DeleteAsync(string profileId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(profileId);
        return _endpoint.SendVoidAsync(
            HttpMethod.Delete, "/v2/organization-members/" + Uri.EscapeDataString(profileId), null, cancellationToken);
    }

    /// <summary>
    /// Locks a member's account so they cannot sign in until an admin unlocks them or they
    /// complete a password reset. The caller must be an admin (an owner, to lock another
    /// owner), may not lock themselves, and the member must have a linked user account.
    ///
    /// <example>
    /// <code>
    /// var locked = await endpoint.Members.LockAsync("d2338742-f3a1-465b-8592-806587413cc1", "Suspicious activity");
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="profileId">The member's profile ID.</param>
    /// <param name="reason">Why the account is being locked (1 to 255 characters). Stored on the user record and shown to admins.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The member's profile with the joined user record.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the member has no user account.</exception>
    /// <sdkOperation>member.lockOrganizationMember</sdkOperation>
    /// <sdkGroup>Member</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<Profile> LockAsync(string profileId, string reason, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(profileId);
        ArgumentException.ThrowIfNullOrEmpty(reason);
        return _endpoint.SendAsync<Profile>(
            HttpMethod.Put,
            "/v2/organization-members/" + Uri.EscapeDataString(profileId),
            new { action = "lock", reason },
            cancellationToken);
    }

    /// <summary>
    /// Unlocks a member whose account was locked by an admin or by too many failed sign-in
    /// attempts. Clears the lock reason and the failure counter. The caller must be an admin
    /// and may not target themselves.
    ///
    /// <example>
    /// <code>
    /// var unlocked = await endpoint.Members.UnlockAsync("d2338742-f3a1-465b-8592-806587413cc1");
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="profileId">The member's profile ID.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The member's profile with the joined user record.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the member has no user account.</exception>
    /// <sdkOperation>member.unlockOrganizationMember</sdkOperation>
    /// <sdkGroup>Member</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<Profile> UnlockAsync(string profileId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(profileId);
        return _endpoint.SendAsync<Profile>(
            HttpMethod.Put,
            "/v2/organization-members/" + Uri.EscapeDataString(profileId),
            new { action = "unlock" },
            cancellationToken);
    }
}
