using Verdocs.Models;

namespace Verdocs.Resources;

/// <summary>
/// Template field calls, reached through the endpoint's TemplateFields property. Fields have
/// no separate ID; they are addressed by name, which these calls URL-encode into the request
/// path. Fields are always enumerated under their template, so there are no list or get calls
/// here; use <see cref="Templates.GetAsync"/>.
/// </summary>
public sealed class TemplateFields
{
    private readonly VerdocsEndpoint _endpoint;

    internal TemplateFields(VerdocsEndpoint endpoint)
    {
        _endpoint = endpoint;
    }

    /// <summary>Adds a field to a template. Note that Y positions are measured bottom to top.</summary>
    /// <param name="templateId">The template to add the field to.</param>
    /// <param name="request">The field to create.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The new field.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the role name does not exist.</exception>
    /// <sdkOperation>field.createField</sdkOperation>
    /// <sdkGroup>Field</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<TemplateField> CreateAsync(string templateId, CreateFieldRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(templateId);
        ArgumentNullException.ThrowIfNull(request);
        return _endpoint.SendAsync<TemplateField>(
            HttpMethod.Post, "/v2/fields/" + Uri.EscapeDataString(templateId), request, cancellationToken);
    }

    /// <summary>Updates a field. Unset request properties leave the stored values unchanged.</summary>
    /// <param name="templateId">The template the field belongs to.</param>
    /// <param name="fieldName">The field's current name.</param>
    /// <param name="request">The properties to change.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The updated field.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because a new name is already in use.</exception>
    /// <sdkOperation>field.updateField</sdkOperation>
    /// <sdkGroup>Field</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<TemplateField> UpdateAsync(string templateId, string fieldName, UpdateFieldRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(templateId);
        ArgumentException.ThrowIfNullOrEmpty(fieldName);
        ArgumentNullException.ThrowIfNull(request);
        return _endpoint.SendAsync<TemplateField>(
            HttpMethod.Patch,
            "/v2/fields/" + Uri.EscapeDataString(templateId) + "/" + Uri.EscapeDataString(fieldName),
            request,
            cancellationToken);
    }

    /// <summary>Removes a field from a template.</summary>
    /// <param name="templateId">The template the field belongs to.</param>
    /// <param name="fieldName">The field's name.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>A task that completes when the field has been deleted.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the field was not found.</exception>
    /// <sdkOperation>field.deleteField</sdkOperation>
    /// <sdkGroup>Field</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task DeleteAsync(string templateId, string fieldName, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(templateId);
        ArgumentException.ThrowIfNullOrEmpty(fieldName);
        return _endpoint.SendVoidAsync(
            HttpMethod.Delete,
            "/v2/fields/" + Uri.EscapeDataString(templateId) + "/" + Uri.EscapeDataString(fieldName),
            null,
            cancellationToken);
    }
}
