using System.Globalization;
using System.Net.Http.Headers;
using Verdocs.Models;

namespace Verdocs.Resources;

/// <summary>
/// Template document (attachment) calls, reached through the endpoint's TemplateDocuments
/// property. Documents are listed under their template; call
/// <see cref="Templates.GetAsync"/> to enumerate them.
/// </summary>
public sealed class TemplateDocuments
{
    private readonly VerdocsEndpoint _endpoint;

    internal TemplateDocuments(VerdocsEndpoint endpoint)
    {
        _endpoint = endpoint;
    }

    /// <summary>
    /// Attaches a document to a template. The upload is multipart: one file part named "file"
    /// plus the template ID as a text part. The document takes its name from the uploaded
    /// file name; there is no name override. PDF and DOCX are accepted (DOCX is converted to
    /// PDF server-side, with the original retained), up to 25 MB.
    ///
    /// <example>
    /// <code>
    /// await using var stream = File.OpenRead("bill-of-sale.pdf");
    /// var document = await endpoint.TemplateDocuments.CreateAsync(
    ///     "d2338742-f3a1-465b-8592-806587413cc1",
    ///     new TemplateFileUpload { Content = stream, FileName = "bill-of-sale.pdf", ContentType = "application/pdf" });
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="templateId">The template to attach the document to.</param>
    /// <param name="file">The file to upload.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The new template document.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the file was an unsupported type.</exception>
    /// <sdkOperation>templateDocument.createTemplateDocument</sdkOperation>
    /// <sdkGroup>TemplateDocument</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<TemplateDocument> CreateAsync(string templateId, TemplateFileUpload file, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(templateId);
        ArgumentNullException.ThrowIfNull(file);

        // Names are pre-quoted because .NET only quotes multipart part names when it must,
        // while browsers (and so the API's usual traffic) always quote them. The part content
        // type matters: the server runs its PDF/DOCX check against the declaration.
        var content = new MultipartFormDataContent();
        var part = new StreamContent(file.Content);
        part.Headers.ContentType = new MediaTypeHeaderValue(file.ContentType);
        content.Add(part, "\"file\"", "\"" + file.FileName + "\"");
        content.Add(new StringContent(templateId), "\"template_id\"");

        return _endpoint.SendAsync<TemplateDocument>(HttpMethod.Post, "/v2/template-documents", content, cancellationToken);
    }

    /// <summary>
    /// Gets a template document's metadata. Non-creators (organization collaborators, for
    /// example) receive only the metadata they are allowed to view. The server sends this
    /// JSON with a text/html content type; the SDK parses the body as JSON regardless.
    ///
    /// <example>
    /// <code>
    /// var document = await endpoint.TemplateDocuments.GetAsync(documentId);
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="documentId">The document's unique ID.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The document's metadata.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the document was not found.</exception>
    /// <sdkOperation>templateDocument.getTemplateDocument</sdkOperation>
    /// <sdkGroup>TemplateDocument</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<TemplateDocument> GetAsync(string documentId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(documentId);
        return _endpoint.SendAsync<TemplateDocument>(
            HttpMethod.Get, "/v2/template-documents/" + Uri.EscapeDataString(documentId), null, cancellationToken);
    }

    /// <summary>
    /// Downloads a template document's file directly. Returns the raw bytes with no redirect;
    /// use this rather than a plain link so the authorization headers are set.
    ///
    /// <example>
    /// <code>
    /// var bytes = await endpoint.TemplateDocuments.DownloadAsync(documentId);
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="documentId">The document's unique ID.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The file's raw bytes.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the document was not found.</exception>
    /// <sdkOperation>templateDocument.downloadTemplateDocument</sdkOperation>
    /// <sdkGroup>TemplateDocument</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<byte[]> DownloadAsync(string documentId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(documentId);
        return _endpoint.SendBytesAsync(
            HttpMethod.Get, "/v2/template-documents/" + Uri.EscapeDataString(documentId) + "?type=file", cancellationToken);
    }

    /// <summary>
    /// Gets a pre-signed download link for a template document (attachment disposition, about
    /// a one hour expiry). The link needs no auth header, so use it immediately and never
    /// share it.
    ///
    /// <example>
    /// <code>
    /// var link = await endpoint.TemplateDocuments.GetDownloadLinkAsync(documentId);
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="documentId">The document's unique ID.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The signed URL, as a bare string.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the document was not found.</exception>
    /// <sdkOperation>templateDocument.getTemplateDocumentDownloadLink</sdkOperation>
    /// <sdkGroup>TemplateDocument</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<string> GetDownloadLinkAsync(string documentId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(documentId);
        return _endpoint.SendStringAsync(
            HttpMethod.Get, "/v2/template-documents/" + Uri.EscapeDataString(documentId) + "?type=download", cancellationToken);
    }

    /// <summary>
    /// Gets a pre-signed preview link (inline disposition). Anomaly preserved from the
    /// js-sdk: this fetches the envelope-documents route, not template-documents, so it only
    /// resolves for envelope document IDs. The template-documents equivalent is
    /// GET /v2/template-documents/:id?type=preview, which this SDK does not wrap yet.
    ///
    /// <example>
    /// <code>
    /// var link = await endpoint.TemplateDocuments.GetPreviewLinkAsync(documentId);
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="documentId">The document ID to link to.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The signed URL, as a bare string.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the document was not found.</exception>
    /// <sdkOperation>templateDocument.getTemplateDocumentPreviewLink</sdkOperation>
    /// <sdkGroup>TemplateDocument</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<string> GetPreviewLinkAsync(string documentId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(documentId);
        return _endpoint.SendStringAsync(
            HttpMethod.Get, "/v2/envelope-documents/" + Uri.EscapeDataString(documentId) + "?type=preview", cancellationToken);
    }

    /// <summary>
    /// Gets a template document file through the legacy templates route. Dead on the deployed
    /// API: the route does not exist, so every call fails. Ported to match the js-sdk
    /// surface; <see cref="DownloadAsync"/> is the working equivalent. Retirement is pending.
    ///
    /// <example>
    /// <code>
    /// var bytes = await endpoint.TemplateDocuments.GetFileAsync(templateId, documentId);
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="templateId">The template the document belongs to.</param>
    /// <param name="documentId">The document's unique ID.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The file's raw bytes, if the API ever serves this route.</returns>
    /// <exception cref="VerdocsApiException">Always thrown today; the deployed API has no handler for this call.</exception>
    /// <sdkOperation>templateDocument.getTemplateDocumentFile</sdkOperation>
    /// <sdkGroup>TemplateDocument</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<byte[]> GetFileAsync(string templateId, string documentId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(templateId);
        ArgumentException.ThrowIfNullOrEmpty(documentId);
        return _endpoint.SendBytesAsync(
            HttpMethod.Get,
            "/v2/templates/" + Uri.EscapeDataString(templateId) + "/documents/" + Uri.EscapeDataString(documentId) + "?file=true",
            cancellationToken);
    }

    /// <summary>
    /// Gets a template document thumbnail through the legacy templates route. Dead on the
    /// deployed API: the route does not exist, so every call fails. Ported to match the
    /// js-sdk surface; the working way to get a thumbnail is the page-image route with the
    /// literal page value "thumb", which this SDK does not wrap yet
    /// (<see cref="GetPageDisplayUriAsync"/> takes numeric pages, matching the js-sdk).
    /// Retirement is pending.
    ///
    /// <example>
    /// <code>
    /// var bytes = await endpoint.TemplateDocuments.GetThumbnailAsync(templateId, documentId);
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="templateId">The template the document belongs to.</param>
    /// <param name="documentId">The document's unique ID.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The thumbnail's raw bytes, if the API ever serves this route.</returns>
    /// <exception cref="VerdocsApiException">Always thrown today; the deployed API has no handler for this call.</exception>
    /// <sdkOperation>templateDocument.getTemplateDocumentThumbnail</sdkOperation>
    /// <sdkGroup>TemplateDocument</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<byte[]> GetThumbnailAsync(string templateId, string documentId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(templateId);
        ArgumentException.ThrowIfNullOrEmpty(documentId);
        return _endpoint.SendBytesAsync(
            HttpMethod.Get,
            "/v2/templates/" + Uri.EscapeDataString(templateId) + "/documents/" + Uri.EscapeDataString(documentId) + "?thumbnail=true",
            cancellationToken);
    }

    /// <summary>
    /// Gets a display URI for one page of a template document. Pages are rendered server-side
    /// to PNG for display only; they are not legally binding and carry no participant
    /// metadata. Get the original file via <see cref="DownloadAsync"/>.
    ///
    /// <example>
    /// <code>
    /// var uri = await endpoint.TemplateDocuments.GetPageDisplayUriAsync(documentId, 0);
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="documentId">The document to render.</param>
    /// <param name="page">0-based page number (0-1000).</param>
    /// <param name="variant">"original" or "tagged".</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The signed URL, as a bare string.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the document was not found.</exception>
    /// <sdkOperation>templateDocument.getTemplateDocumentPageDisplayUri</sdkOperation>
    /// <sdkGroup>TemplateDocument</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<string> GetPageDisplayUriAsync(string documentId, int page, string variant = "original", CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(documentId);
        ArgumentOutOfRangeException.ThrowIfNegative(page);
        ArgumentException.ThrowIfNullOrEmpty(variant);
        return _endpoint.SendStringAsync(
            HttpMethod.Get,
            "/v2/template-documents/page-image/" + Uri.EscapeDataString(documentId) + "/" + Uri.EscapeDataString(variant)
                + "/" + page.ToString(CultureInfo.InvariantCulture),
            cancellationToken);
    }

    /// <summary>
    /// Deletes a template document. Returns the remaining deep template: the js-sdk doc tag
    /// claims a bare status string, but its code and the server both return the template.
    ///
    /// <example>
    /// <code>
    /// var template = await endpoint.TemplateDocuments.DeleteAsync(documentId);
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="documentId">The document's unique ID.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The template the document was removed from, with its remaining documents, roles, and fields.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the caller may not edit the template.</exception>
    /// <sdkOperation>templateDocument.deleteTemplateDocument</sdkOperation>
    /// <sdkGroup>TemplateDocument</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<Template> DeleteAsync(string documentId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(documentId);
        return _endpoint.SendAsync<Template>(
            HttpMethod.Delete, "/v2/template-documents/" + Uri.EscapeDataString(documentId), null, cancellationToken);
    }
}
