using System.Net.Http.Headers;
using Verdocs.Models;

namespace Verdocs.Resources;

/// <summary>
/// Brand calls, reached through the endpoint's Brands property. A brand is a white-label
/// profile (logos, colors, custom app and email domains) applied to envelopes sent under it.
/// Every call requires the caller to be an admin of the organization, and the organization ID
/// must be the caller's own.
/// </summary>
public sealed class Brands
{
    private readonly VerdocsEndpoint _endpoint;

    internal Brands(VerdocsEndpoint endpoint)
    {
        _endpoint = endpoint;
    }

    /// <summary>
    /// Gets the brands for an organization, oldest first.
    /// </summary>
    /// <param name="organizationId">The organization's unique ID.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The organization's brands.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the caller is not an admin.</exception>
    /// <sdkOperation>brand.getBrands</sdkOperation>
    /// <sdkGroup>Brand</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<IReadOnlyList<Brand>> ListAsync(string organizationId, CancellationToken cancellationToken = default)
    {
        return ListCoreAsync(BuildPath(organizationId), cancellationToken);
    }

    private async Task<IReadOnlyList<Brand>> ListCoreAsync(string pathAndQuery, CancellationToken cancellationToken)
    {
        return await _endpoint.SendAsync<List<Brand>>(HttpMethod.Get, pathAndQuery, null, cancellationToken)
            .ConfigureAwait(false);
    }

    /// <summary>
    /// Creates a brand.
    /// </summary>
    /// <param name="organizationId">The organization's unique ID.</param>
    /// <param name="request">Details for the new brand.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The new brand.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the key is already in use.</exception>
    /// <sdkOperation>brand.createBrand</sdkOperation>
    /// <sdkGroup>Brand</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<Brand> CreateAsync(string organizationId, CreateBrandRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(organizationId);
        ArgumentNullException.ThrowIfNull(request);
        return _endpoint.SendAsync<Brand>(HttpMethod.Post, BuildPath(organizationId), request, cancellationToken);
    }

    /// <summary>
    /// Gets one brand by its ID.
    /// </summary>
    /// <param name="organizationId">The organization's unique ID.</param>
    /// <param name="brandId">The brand's unique ID.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The requested brand.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the brand was not found.</exception>
    /// <sdkOperation>brand.getBrand</sdkOperation>
    /// <sdkGroup>Brand</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<Brand> GetAsync(string organizationId, string brandId, CancellationToken cancellationToken = default)
    {
        return _endpoint.SendAsync<Brand>(HttpMethod.Get, BuildPath(organizationId, brandId), null, cancellationToken);
    }

    /// <summary>
    /// Updates a brand. Only the fields set on the request are sent; fields omitted are left
    /// unchanged.
    /// </summary>
    /// <param name="organizationId">The organization's unique ID.</param>
    /// <param name="brandId">The brand's unique ID.</param>
    /// <param name="request">The changes to apply.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The updated brand.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the brand was not found.</exception>
    /// <sdkOperation>brand.updateBrand</sdkOperation>
    /// <sdkGroup>Brand</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<Brand> UpdateAsync(string organizationId, string brandId, UpdateBrandRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        return _endpoint.SendAsync<Brand>(HttpMethod.Patch, BuildPath(organizationId, brandId), request, cancellationToken);
    }

    /// <summary>
    /// Uploads a new full-size logo for the brand, setting its full logo URL. The stream is
    /// read once and disposed with the request.
    /// </summary>
    /// <param name="organizationId">The organization's unique ID.</param>
    /// <param name="brandId">The brand's unique ID.</param>
    /// <param name="file">The image content.</param>
    /// <param name="fileName">File name to declare for the upload, for example "logo.png".</param>
    /// <param name="contentType">MIME type to declare for the upload, for example "image/png".</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The updated brand.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the brand was not found.</exception>
    /// <sdkOperation>brand.updateBrandLogo</sdkOperation>
    /// <sdkGroup>Brand</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<Brand> UpdateLogoAsync(
        string organizationId,
        string brandId,
        Stream file,
        string fileName,
        string contentType,
        CancellationToken cancellationToken = default)
    {
        return SendFileAsync(organizationId, brandId, "logo", file, fileName, contentType, cancellationToken);
    }

    /// <summary>
    /// Uploads a new thumbnail for the brand, setting its thumbnail URL. The stream is read
    /// once and disposed with the request.
    /// </summary>
    /// <param name="organizationId">The organization's unique ID.</param>
    /// <param name="brandId">The brand's unique ID.</param>
    /// <param name="file">The image content. A square image is recommended.</param>
    /// <param name="fileName">File name to declare for the upload, for example "thumbnail.png".</param>
    /// <param name="contentType">MIME type to declare for the upload, for example "image/png".</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The updated brand.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the brand was not found.</exception>
    /// <sdkOperation>brand.updateBrandThumbnail</sdkOperation>
    /// <sdkGroup>Brand</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<Brand> UpdateThumbnailAsync(
        string organizationId,
        string brandId,
        Stream file,
        string fileName,
        string contentType,
        CancellationToken cancellationToken = default)
    {
        return SendFileAsync(organizationId, brandId, "thumbnail", file, fileName, contentType, cancellationToken);
    }

    /// <summary>
    /// Deletes a brand. The organization's default brand cannot be deleted.
    /// </summary>
    /// <param name="organizationId">The organization's unique ID.</param>
    /// <param name="brandId">The brand's unique ID.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>A task that completes when the brand is deleted.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the brand is the default.</exception>
    /// <sdkOperation>brand.deleteBrand</sdkOperation>
    /// <sdkGroup>Brand</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task DeleteAsync(string organizationId, string brandId, CancellationToken cancellationToken = default)
    {
        return _endpoint.SendVoidAsync(HttpMethod.Delete, BuildPath(organizationId, brandId), null, cancellationToken);
    }

    /// <summary>
    /// Adds a custom email domain to a brand. The response carries the DNS records to
    /// publish (DKIM tokens and status flags); verify them with
    /// <see cref="VerifyEmailDomainAsync"/> once published.
    /// </summary>
    /// <param name="organizationId">The organization's unique ID.</param>
    /// <param name="brandId">The brand's unique ID.</param>
    /// <param name="request">The domain and sender address details.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The updated brand with its email domain configuration.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the domain is invalid.</exception>
    /// <sdkOperation>brand.addBrandEmailDomain</sdkOperation>
    /// <sdkGroup>Brand</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<Brand> AddEmailDomainAsync(
        string organizationId,
        string brandId,
        AddBrandEmailDomainRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        return _endpoint.SendAsync<Brand>(
            HttpMethod.Post, BuildPath(organizationId, brandId) + "/email-domain", request, cancellationToken);
    }

    /// <summary>
    /// Removes a brand's custom email domain. Branded email reverts to the Verdocs sender.
    /// </summary>
    /// <param name="organizationId">The organization's unique ID.</param>
    /// <param name="brandId">The brand's unique ID.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The updated brand with the email domain removed.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the brand was not found.</exception>
    /// <sdkOperation>brand.removeBrandEmailDomain</sdkOperation>
    /// <sdkGroup>Brand</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<Brand> RemoveEmailDomainAsync(string organizationId, string brandId, CancellationToken cancellationToken = default)
    {
        return _endpoint.SendAsync<Brand>(
            HttpMethod.Delete, BuildPath(organizationId, brandId) + "/email-domain", null, cancellationToken);
    }

    /// <summary>
    /// Triggers verification of a brand's email domain DNS records (SPF, DKIM, DMARC).
    /// </summary>
    /// <param name="organizationId">The organization's unique ID.</param>
    /// <param name="brandId">The brand's unique ID.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The updated brand with its current verification status.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because no email domain is configured.</exception>
    /// <sdkOperation>brand.verifyBrandEmailDomain</sdkOperation>
    /// <sdkGroup>Brand</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<Brand> VerifyEmailDomainAsync(string organizationId, string brandId, CancellationToken cancellationToken = default)
    {
        return _endpoint.SendAsync<Brand>(
            HttpMethod.Post, BuildPath(organizationId, brandId) + "/email-domain/verify", null, cancellationToken);
    }

    private Task<Brand> SendFileAsync(
        string organizationId,
        string brandId,
        string partName,
        Stream file,
        string fileName,
        string contentType,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(file);
        ArgumentException.ThrowIfNullOrEmpty(fileName);
        ArgumentException.ThrowIfNullOrEmpty(contentType);

        // Names are pre-quoted because .NET only quotes multipart part names when it must,
        // while browsers (the API's usual traffic) always quote them. The server keys off the
        // part name: "logo" updates full_logo_url and "thumbnail" updates thumbnail_url.
        var content = new MultipartFormDataContent();
        var part = new StreamContent(file);
        part.Headers.ContentType = new MediaTypeHeaderValue(contentType);
        content.Add(part, "\"" + partName + "\"", "\"" + fileName + "\"");

        return _endpoint.SendAsync<Brand>(HttpMethod.Patch, BuildPath(organizationId, brandId), content, cancellationToken);
    }

    private static string BuildPath(string organizationId)
    {
        ArgumentException.ThrowIfNullOrEmpty(organizationId);
        return "/v2/organizations/" + Uri.EscapeDataString(organizationId) + "/brands";
    }

    private static string BuildPath(string organizationId, string brandId)
    {
        ArgumentException.ThrowIfNullOrEmpty(brandId);
        return BuildPath(organizationId) + "/" + Uri.EscapeDataString(brandId);
    }
}
