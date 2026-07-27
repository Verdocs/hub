using Verdocs.Models;

namespace Verdocs.Resources;

/// <summary>
/// Organization contact calls, reached through the endpoint's Contacts property. A contact is
/// a profile with no access to the organization; contacts exist to populate quick-search
/// lists when sending envelopes.
/// </summary>
public sealed class Contacts
{
    private readonly VerdocsEndpoint _endpoint;

    internal Contacts(VerdocsEndpoint endpoint)
    {
        _endpoint = endpoint;
    }

    /// <summary>
    /// Gets the contacts in the caller's organization, sorted by name.
    /// </summary>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The organization's contact profiles.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the session is invalid.</exception>
    /// <sdkOperation>contact.getOrganizationContacts</sdkOperation>
    /// <sdkGroup>Contact</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public async Task<IReadOnlyList<Profile>> ListAsync(CancellationToken cancellationToken = default)
    {
        return await _endpoint.SendAsync<List<Profile>>(HttpMethod.Get, "/v2/organization-contacts", null, cancellationToken)
            .ConfigureAwait(false);
    }

    /// <summary>
    /// Creates a contact in the caller's organization. The caller must be an admin.
    /// </summary>
    /// <param name="request">Details for the new contact.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The new contact profile.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the caller is not an admin.</exception>
    /// <sdkOperation>contact.createOrganizationContact</sdkOperation>
    /// <sdkGroup>Contact</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<Profile> CreateAsync(CreateContactRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        return _endpoint.SendAsync<Profile>(HttpMethod.Post, "/v2/organization-contacts", request, cancellationToken);
    }

    /// <summary>
    /// Updates a contact. The caller must be an admin, and the profile must be a contact
    /// rather than a member.
    /// </summary>
    /// <param name="profileId">The contact's profile ID.</param>
    /// <param name="request">The replacement values.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The updated contact profile.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the profile is not a contact.</exception>
    /// <sdkOperation>contact.updateOrganizationContact</sdkOperation>
    /// <sdkGroup>Contact</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<Profile> UpdateAsync(string profileId, UpdateContactRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(profileId);
        ArgumentNullException.ThrowIfNull(request);
        return _endpoint.SendAsync<Profile>(
            HttpMethod.Patch, "/v2/organization-contacts/" + Uri.EscapeDataString(profileId), request, cancellationToken);
    }

    /// <summary>
    /// Deletes a contact from the caller's organization. The caller must be an admin. Any
    /// envelopes, recipient records, and templates tied to the contact are reassigned to the
    /// caller.
    /// </summary>
    /// <param name="profileId">The contact's profile ID.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>A task that completes when the contact is deleted.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the profile is not a contact.</exception>
    /// <sdkOperation>contact.deleteOrganizationContact</sdkOperation>
    /// <sdkGroup>Contact</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task DeleteAsync(string profileId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(profileId);
        return _endpoint.SendVoidAsync(
            HttpMethod.Delete, "/v2/organization-contacts/" + Uri.EscapeDataString(profileId), null, cancellationToken);
    }
}
