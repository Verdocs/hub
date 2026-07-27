using Verdocs.Models;

namespace Verdocs.Resources;

/// <summary>
/// API key calls, reached through the endpoint's ApiKeys property. API keys authenticate
/// server-to-server calls and act as one profile; every call requires the caller to be an
/// admin of the organization. Rotating or updating a key never invalidates sessions already
/// issued from it, so keys can be rotated at any time without disrupting an application.
/// </summary>
public sealed class ApiKeys
{
    private readonly VerdocsEndpoint _endpoint;

    internal ApiKeys(VerdocsEndpoint endpoint)
    {
        _endpoint = endpoint;
    }

    /// <summary>
    /// Gets the API keys for the caller's organization, each with its acting profile. Secrets
    /// are never included in listings; they are returned only by <see cref="CreateAsync"/>
    /// and <see cref="RotateAsync"/>.
    ///
    /// <example>
    /// <code>
    /// var apiKeys = await endpoint.ApiKeys.ListAsync();
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The organization's API keys, without secrets.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the caller is not an admin.</exception>
    /// <sdkOperation>apiKey.getApiKeys</sdkOperation>
    /// <sdkGroup>ApiKey</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public async Task<IReadOnlyList<ApiKey>> ListAsync(CancellationToken cancellationToken = default)
    {
        return await _endpoint.SendAsync<List<ApiKey>>(HttpMethod.Get, "/v2/api-keys", null, cancellationToken)
            .ConfigureAwait(false);
    }

    /// <summary>
    /// Creates an API key acting as the given profile. Store the returned secret safely: this
    /// response and <see cref="RotateAsync"/> are the only places it appears.
    ///
    /// <example>
    /// <code>
    /// var apiKey = await endpoint.ApiKeys.CreateAsync(new CreateApiKeyRequest
    /// {
    ///     Name = "Integration key",
    ///     ProfileId = "d2338742-f3a1-465b-8592-806587413cc1",
    /// });
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="request">Details for the new key.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The new key, including its secret.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the profile is not in the caller's organization.</exception>
    /// <sdkOperation>apiKey.createApiKey</sdkOperation>
    /// <sdkGroup>ApiKey</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<ApiKey> CreateAsync(CreateApiKeyRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        return _endpoint.SendAsync<ApiKey>(HttpMethod.Post, "/v2/api-keys", request, cancellationToken);
    }

    /// <summary>
    /// Rotates an API key's secret. Existing sessions issued from the key stay valid, so
    /// rotation is safe to do at any time.
    ///
    /// <example>
    /// <code>
    /// var rotated = await endpoint.ApiKeys.RotateAsync("d2338742-f3a1-465b-8592-806587413cc1");
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="clientId">The client ID of the key to rotate.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The key with its new secret.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the key was not found.</exception>
    /// <sdkOperation>apiKey.rotateApiKey</sdkOperation>
    /// <sdkGroup>ApiKey</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<ApiKey> RotateAsync(string clientId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(clientId);
        return _endpoint.SendAsync<ApiKey>(
            HttpMethod.Post, "/v2/api-keys/" + Uri.EscapeDataString(clientId) + "/rotate", null, cancellationToken);
    }

    /// <summary>
    /// Updates an API key's name, acting profile, or admin flag. Only the fields set on the
    /// request are sent; fields omitted are left unchanged.
    ///
    /// <example>
    /// <code>
    /// var updated = await endpoint.ApiKeys.UpdateAsync(
    ///     "d2338742-f3a1-465b-8592-806587413cc1",
    ///     new UpdateApiKeyRequest { Name = "Integration key (renamed)" });
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="clientId">The client ID of the key to update.</param>
    /// <param name="request">The changes to apply.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The updated key, without its secret.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the key was not found.</exception>
    /// <sdkOperation>apiKey.updateApiKey</sdkOperation>
    /// <sdkGroup>ApiKey</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<ApiKey> UpdateAsync(string clientId, UpdateApiKeyRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(clientId);
        ArgumentNullException.ThrowIfNull(request);
        return _endpoint.SendAsync<ApiKey>(
            HttpMethod.Patch, "/v2/api-keys/" + Uri.EscapeDataString(clientId), request, cancellationToken);
    }

    /// <summary>
    /// Deletes an API key. Sessions already issued from the key remain valid until they
    /// expire, but no new sessions can be created with it.
    ///
    /// <example>
    /// <code>
    /// await endpoint.ApiKeys.DeleteAsync("d2338742-f3a1-465b-8592-806587413cc1");
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="clientId">The client ID of the key to delete.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>A task that completes when the key is deleted.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the caller is not an admin.</exception>
    /// <sdkOperation>apiKey.deleteApiKey</sdkOperation>
    /// <sdkGroup>ApiKey</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task DeleteAsync(string clientId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(clientId);
        return _endpoint.SendVoidAsync(
            HttpMethod.Delete, "/v2/api-keys/" + Uri.EscapeDataString(clientId), null, cancellationToken);
    }
}
