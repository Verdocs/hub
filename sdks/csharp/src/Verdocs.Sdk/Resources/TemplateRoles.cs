using Verdocs.Models;

namespace Verdocs.Resources;

/// <summary>
/// Template role calls, reached through the endpoint's TemplateRoles property. A role is a
/// placeholder participant ("Tenant 1") that becomes a named recipient when an envelope is
/// created from the template. Roles have no separate ID; they are addressed by name, which
/// these calls URL-encode into the request path. Roles are always enumerated under their
/// template, so there are no list or get calls here; use <see cref="Templates.GetAsync"/>.
/// </summary>
public sealed class TemplateRoles
{
    private readonly VerdocsEndpoint _endpoint;

    internal TemplateRoles(VerdocsEndpoint endpoint)
    {
        _endpoint = endpoint;
    }

    /// <summary>Adds a role to a template.</summary>
    /// <param name="templateId">The template to add the role to.</param>
    /// <param name="request">The role to create.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The new role.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the role name is already in use.</exception>
    public Task<Role> CreateAsync(string templateId, CreateRoleRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(templateId);
        ArgumentNullException.ThrowIfNull(request);
        return _endpoint.SendAsync<Role>(
            HttpMethod.Post, "/v2/roles/" + Uri.EscapeDataString(templateId), request, cancellationToken);
    }

    /// <summary>Updates a role. Unset request properties leave the stored values unchanged.</summary>
    /// <param name="templateId">The template the role belongs to.</param>
    /// <param name="roleName">The role's current name.</param>
    /// <param name="request">The properties to change.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The updated role.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because a new name is already in use.</exception>
    public Task<Role> UpdateAsync(string templateId, string roleName, UpdateRoleRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(templateId);
        ArgumentException.ThrowIfNullOrEmpty(roleName);
        ArgumentNullException.ThrowIfNull(request);
        return _endpoint.SendAsync<Role>(
            HttpMethod.Patch,
            "/v2/roles/" + Uri.EscapeDataString(templateId) + "/" + Uri.EscapeDataString(roleName),
            request,
            cancellationToken);
    }

    /// <summary>Deletes a role.</summary>
    /// <param name="templateId">The template the role belongs to.</param>
    /// <param name="roleName">The role's name.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>A task that completes when the role has been deleted.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the role was not found.</exception>
    public Task DeleteAsync(string templateId, string roleName, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(templateId);
        ArgumentException.ThrowIfNullOrEmpty(roleName);
        return _endpoint.SendVoidAsync(
            HttpMethod.Delete,
            "/v2/roles/" + Uri.EscapeDataString(templateId) + "/" + Uri.EscapeDataString(roleName),
            null,
            cancellationToken);
    }
}
