using System.Globalization;
using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using Verdocs.Models;

namespace Verdocs.Resources;

/// <summary>
/// Envelope calls, reached through the endpoint's Envelopes property. An envelope shepherds
/// one or more documents through the recipients in a signing workflow.
/// </summary>
public sealed class Envelopes
{
    private readonly VerdocsEndpoint _endpoint;

    internal Envelopes(VerdocsEndpoint endpoint)
    {
        _endpoint = endpoint;
    }

    /// <summary>
    /// Creates an envelope, either from a template or directly from documents. Requires a user
    /// session. Envelope creation is JSON only on the wire (the deployed handler never reads
    /// uploaded file parts), so documents are attached as base64
    /// <see cref="CreateEnvelopeDocument.Data"/> or by <see cref="CreateEnvelopeDocument.Uri"/>.
    ///
    /// <example>
    /// <code>
    /// var envelope = await endpoint.Envelopes.CreateAsync(new CreateEnvelopeRequest
    /// {
    ///     TemplateId = "d2338742-f3a1-465b-8592-806587413cc1",
    ///     Name = "Bill of Sale",
    ///     Recipients =
    ///     [
    ///         new CreateEnvelopeRecipient
    ///         {
    ///             Type = "signer",
    ///             RoleName = "Seller",
    ///             FirstName = "Paige",
    ///             LastName = "Turner",
    ///             Email = "paige.turner@example.com",
    ///             Sequence = 1,
    ///         },
    ///     ],
    /// });
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="request">The envelope to create.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The newly created envelope, with its documents, fields, and recipients.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because a recipient failed validation.</exception>
    /// <sdkOperation>envelope.createEnvelope</sdkOperation>
    /// <sdkGroup>Envelope</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    /// <sdkGettingStarted />
    public Task<Envelope> CreateAsync(CreateEnvelopeRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        return _endpoint.SendAsync<Envelope>(HttpMethod.Post, "/v2/envelopes", request, cancellationToken);
    }

    /// <summary>
    /// Gets all metadata for an envelope. Non-creators such as recipients receive only the
    /// metadata they are allowed to view.
    ///
    /// <example>
    /// <code>
    /// var envelope = await endpoint.Envelopes.GetAsync(envelopeId);
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="envelopeId">The envelope to retrieve.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The detailed metadata for the envelope requested.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the envelope was not found.</exception>
    /// <sdkOperation>envelope.getEnvelope</sdkOperation>
    /// <sdkGroup>Envelope</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<Envelope> GetAsync(string envelopeId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(envelopeId);
        return _endpoint.SendAsync<Envelope>(HttpMethod.Get, "/v2/envelopes/" + Uri.EscapeDataString(envelopeId), null, cancellationToken);
    }

    /// <summary>
    /// Lists the envelopes accessible to the caller, with optional filters.
    ///
    /// <example>
    /// <code>
    /// var page = await endpoint.Envelopes.ListAsync(new ListEnvelopesOptions
    /// {
    ///     View = "inbox",
    ///     Rows = 20,
    /// });
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="options">Optional filters, sorting, and paging.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>One page of envelopes plus paging counts.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the session is invalid.</exception>
    /// <sdkOperation>envelope.getEnvelopes</sdkOperation>
    /// <sdkGroup>Envelope</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<EnvelopeList> ListAsync(ListEnvelopesOptions? options = null, CancellationToken cancellationToken = default)
    {
        return _endpoint.SendAsync<EnvelopeList>(HttpMethod.Get, BuildListPath(options), null, cancellationToken);
    }

    /// <summary>
    /// Updates an envelope's settings: name, sender identity, reminders, expiration,
    /// visibility, contact preferences, and metadata.
    ///
    /// <example>
    /// <code>
    /// var envelope = await endpoint.Envelopes.UpdateAsync(envelopeId, new UpdateEnvelopeRequest
    /// {
    ///     Name = "Bill of Sale (Revised)",
    /// });
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="envelopeId">The envelope to update.</param>
    /// <param name="request">The fields to change; unset fields are left alone.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>A copy of the updated envelope.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the caller is not the creator.</exception>
    /// <sdkOperation>envelope.updateEnvelope</sdkOperation>
    /// <sdkGroup>Envelope</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    /// <sdkGettingStarted />
    public Task<Envelope> UpdateAsync(string envelopeId, UpdateEnvelopeRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(envelopeId);
        ArgumentNullException.ThrowIfNull(request);
        return _endpoint.SendAsync<Envelope>(HttpMethod.Patch, "/v2/envelopes/" + Uri.EscapeDataString(envelopeId), request, cancellationToken);
    }

    /// <summary>
    /// Cancels an envelope. This is permanent: recipients can no longer act on it.
    ///
    /// <example>
    /// <code>
    /// var envelope = await endpoint.Envelopes.CancelAsync(envelopeId);
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="envelopeId">The envelope to cancel.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The updated envelope. The response omits relations such as recipients, so those properties are null here.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the caller is not the creator.</exception>
    /// <sdkOperation>envelope.cancelEnvelope</sdkOperation>
    /// <sdkGroup>Envelope</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<Envelope> CancelAsync(string envelopeId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(envelopeId);
        return _endpoint.SendAsync<Envelope>(
            HttpMethod.Put,
            "/v2/envelopes/" + Uri.EscapeDataString(envelopeId),
            new { action = "cancel" },
            cancellationToken);
    }

    /// <summary>
    /// Gets an envelope document's metadata. Accepts a user or signing session; the caller must
    /// be the envelope's creator or one of its recipients.
    ///
    /// <example>
    /// <code>
    /// var document = await endpoint.Envelopes.GetDocumentAsync(documentId);
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="documentId">The document to retrieve.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The detailed metadata for the document requested.</returns>
    /// <exception cref="VerdocsApiException">The call failed or the response could not be parsed.</exception>
    /// <sdkOperation>envelope.getEnvelopeDocument</sdkOperation>
    /// <sdkGroup>Envelope</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<EnvelopeDocument> GetDocumentAsync(string documentId, CancellationToken cancellationToken = default)
    {
        // Usage errors throw synchronously (rule 16); the async work lives in the core method.
        ArgumentException.ThrowIfNullOrEmpty(documentId);
        return GetDocumentCoreAsync(documentId, cancellationToken);
    }

    private async Task<EnvelopeDocument> GetDocumentCoreAsync(string documentId, CancellationToken cancellationToken)
    {
        // The server sends this metadata as JSON.stringify output under a text/html
        // Content-Type, so we fetch it as text and parse it ourselves rather than trusting
        // the declared type.
        var body = await _endpoint
            .SendStringAsync(HttpMethod.Get, "/v2/envelope-documents/" + Uri.EscapeDataString(documentId), cancellationToken)
            .ConfigureAwait(false);

        try
        {
            return JsonSerializer.Deserialize<EnvelopeDocument>(body, VerdocsJson.Options)
                ?? throw new VerdocsApiException(
                    HttpStatusCode.OK,
                    body,
                    "The Verdocs API returned an empty body where a value was required.");
        }
        catch (JsonException exception)
        {
            throw new VerdocsApiException(HttpStatusCode.OK, body, "The Verdocs API response could not be parsed.", exception);
        }
    }

    /// <summary>
    /// Downloads an envelope document's content directly. Accepts a user or signing session.
    /// For attachment-type documents this serves the filled variant; for anything else it
    /// serves the certificate. Signed variants are generated asynchronously after finalize, so
    /// poll the envelope until the certificate document's Signed flag is true before fetching.
    ///
    /// <example>
    /// <code>
    /// var bytes = await endpoint.Envelopes.DownloadDocumentAsync(documentId);
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="documentId">The document to download.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The raw file bytes.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the caller is not a participant.</exception>
    /// <sdkOperation>envelope.downloadEnvelopeDocument</sdkOperation>
    /// <sdkGroup>Envelope</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<byte[]> DownloadDocumentAsync(string documentId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(documentId);
        return RetryOnceOnTimeoutAsync(() => _endpoint.SendBytesAsync(
            HttpMethod.Get,
            "/v2/envelope-documents/" + Uri.EscapeDataString(documentId) + "?type=file",
            cancellationToken));
    }

    /// <summary>
    /// Gets a pre-signed download link for an envelope document. The link expires within an
    /// hour, so use it immediately and never store or share it. Accepts a user or signing
    /// session.
    ///
    /// <example>
    /// <code>
    /// var url = await endpoint.Envelopes.GetDocumentDownloadLinkAsync(documentId);
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="documentId">The document to link to.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The download URL, fetchable without auth headers.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the caller is not a participant.</exception>
    /// <sdkOperation>envelope.getEnvelopeDocumentDownloadLink</sdkOperation>
    /// <sdkGroup>Envelope</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<string> GetDocumentDownloadLinkAsync(string documentId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(documentId);
        return RetryOnceOnTimeoutAsync(() => _endpoint.SendStringAsync(
            HttpMethod.Get,
            "/v2/envelope-documents/" + Uri.EscapeDataString(documentId) + "?type=download",
            cancellationToken));
    }

    /// <summary>
    /// Gets a pre-signed download link for the single PDF that combines all of an envelope's
    /// documents with its completion certificate, in workflow order. Pass the certificate
    /// document's ID; the combined PDF shares it. Older envelopes may predate combined PDF
    /// generation. The link expires within an hour.
    ///
    /// <example>
    /// <code>
    /// var url = await endpoint.Envelopes.GetCombinedDocumentDownloadLinkAsync(documentId);
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="documentId">The envelope's certificate document ID.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The download URL, fetchable without auth headers.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the envelope has no combined PDF.</exception>
    /// <sdkOperation>envelope.getCombinedEnvelopeDocumentDownloadLink</sdkOperation>
    /// <sdkGroup>Envelope</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<string> GetCombinedDocumentDownloadLinkAsync(string documentId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(documentId);
        return RetryOnceOnTimeoutAsync(() => _endpoint.SendStringAsync(
            HttpMethod.Get,
            "/v2/envelope-documents/" + Uri.EscapeDataString(documentId) + "?type=download&combined=true",
            cancellationToken));
    }

    /// <summary>
    /// Gets a pre-signed preview link for an envelope document (inline content disposition).
    /// The link expires within an hour, so use it immediately and never store or share it.
    /// Accepts a user or signing session.
    ///
    /// <example>
    /// <code>
    /// var url = await endpoint.Envelopes.GetDocumentPreviewLinkAsync(documentId);
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="documentId">The document to link to.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The preview URL, fetchable without auth headers.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the caller is not a participant.</exception>
    /// <sdkOperation>envelope.getEnvelopeDocumentPreviewLink</sdkOperation>
    /// <sdkGroup>Envelope</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<string> GetDocumentPreviewLinkAsync(string documentId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(documentId);
        return RetryOnceOnTimeoutAsync(() => _endpoint.SendStringAsync(
            HttpMethod.Get,
            "/v2/envelope-documents/" + Uri.EscapeDataString(documentId) + "?type=preview",
            cancellationToken));
    }

    /// <summary>
    /// Downloads a file attached to an envelope. Kept for parity with the js-sdk's deprecated
    /// getEnvelopeFile; it fetches the same bytes as <see cref="DownloadDocumentAsync"/>.
    ///
    /// <example>
    /// <code>
    /// var bytes = await endpoint.Envelopes.GetFileAsync(documentId);
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="documentId">The document to download.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The raw file bytes.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the caller is not a participant.</exception>
    /// <sdkOperation>envelope.getEnvelopeFile</sdkOperation>
    /// <sdkGroup>Envelope</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    [Obsolete("Use GetDocumentPreviewLinkAsync, GetDocumentDownloadLinkAsync, or DownloadDocumentAsync instead.")]
    public Task<byte[]> GetFileAsync(string documentId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(documentId);
        return _endpoint.SendBytesAsync(
            HttpMethod.Get,
            "/v2/envelope-documents/" + Uri.EscapeDataString(documentId) + "?type=file",
            cancellationToken);
    }

    /// <summary>
    /// Updates an envelope field's value, typically as a recipient fills in fields while
    /// signing. Accepts a user or signing session valid for the field's role. For signature
    /// and initial fields, pass the ID of a stored signature or initials block. Checkboxes and
    /// radio buttons take the strings "true"/"false" (the server deliberately does not coerce
    /// booleans). Attachment fields are updated with <see cref="UploadFieldAttachmentAsync"/>
    /// instead, and timestamp and payment fields reject direct writes.
    ///
    /// <example>
    /// <code>
    /// var field = await endpoint.Envelopes.UpdateFieldAsync(envelopeId, "Recipient 1", "full_name", "Paige Turner");
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="envelopeId">The envelope to operate on.</param>
    /// <param name="roleName">The role the field is assigned to.</param>
    /// <param name="fieldName">The name of the field to update.</param>
    /// <param name="value">The value to set.</param>
    /// <param name="prepared">True when the sender is pre-filling the field before sending.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>A copy of the updated field.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the value failed validation.</exception>
    /// <sdkOperation>envelope.updateEnvelopeField</sdkOperation>
    /// <sdkGroup>Envelope</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    /// <sdkGettingStarted />
    public Task<EnvelopeField> UpdateFieldAsync(
        string envelopeId,
        string roleName,
        string fieldName,
        string value,
        bool prepared = false,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(envelopeId);
        ArgumentException.ThrowIfNullOrEmpty(roleName);
        ArgumentException.ThrowIfNullOrEmpty(fieldName);
        ArgumentNullException.ThrowIfNull(value);
        return _endpoint.SendAsync<EnvelopeField>(
            HttpMethod.Put,
            FieldPath(envelopeId, roleName, fieldName),
            new { value, prepared },
            cancellationToken);
    }

    /// <summary>
    /// Uploads a file to an attachment field. Accepts a user or signing session valid for the
    /// field's role. Any content type is accepted (files are virus-scanned server-side), but
    /// set <paramref name="contentType"/> accurately because the server trusts the declared
    /// type. Large uploads can outlast short endpoint timeouts; the js-sdk allows two minutes.
    ///
    /// <example>
    /// <code>
    /// using var content = File.OpenRead("w9.pdf");
    /// var field = await endpoint.Envelopes.UploadFieldAttachmentAsync(envelopeId, "Recipient 1", "attachment_1", content, "w9.pdf");
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="envelopeId">The envelope to operate on.</param>
    /// <param name="roleName">The role the field is assigned to.</param>
    /// <param name="fieldName">The name of the attachment field.</param>
    /// <param name="content">The file content to upload.</param>
    /// <param name="fileName">The filename to store with the attachment.</param>
    /// <param name="contentType">The file's MIME type. Defaults to application/octet-stream.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>A copy of the updated field.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the file failed the virus scan.</exception>
    /// <sdkOperation>envelope.uploadEnvelopeFieldAttachment</sdkOperation>
    /// <sdkGroup>Envelope</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<EnvelopeField> UploadFieldAttachmentAsync(
        string envelopeId,
        string roleName,
        string fieldName,
        Stream content,
        string fileName,
        string? contentType = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(envelopeId);
        ArgumentException.ThrowIfNullOrEmpty(roleName);
        ArgumentException.ThrowIfNullOrEmpty(fieldName);
        ArgumentNullException.ThrowIfNull(content);
        ArgumentException.ThrowIfNullOrEmpty(fileName);

        var form = new MultipartFormDataContent();
        var filePart = new StreamContent(content);
        filePart.Headers.ContentType = new MediaTypeHeaderValue(contentType ?? "application/octet-stream");
        // Browsers always quote part names and filenames while .NET leaves token-safe values
        // unquoted, so we pre-quote to keep the wire shape identical to the js-sdk's.
        filePart.Headers.ContentDisposition = new ContentDispositionHeaderValue("form-data")
        {
            Name = "\"document\"",
            FileName = "\"" + fileName + "\"",
        };
        form.Add(filePart);
        form.Add(EmptyValuePart());

        return _endpoint.SendAsync<EnvelopeField>(HttpMethod.Put, FieldPath(envelopeId, roleName, fieldName), form, cancellationToken);
    }

    /// <summary>
    /// Removes the file from an attachment field. This is a PUT rather than a DELETE because
    /// the field itself survives; omitting the file part is what signals the server to clear
    /// the current attachment. Accepts a user or signing session valid for the field's role.
    ///
    /// <example>
    /// <code>
    /// var field = await endpoint.Envelopes.DeleteFieldAttachmentAsync(envelopeId, "Recipient 1", "attachment_1");
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="envelopeId">The envelope to operate on.</param>
    /// <param name="roleName">The role the field is assigned to.</param>
    /// <param name="fieldName">The name of the attachment field.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>A copy of the updated field.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the field is not an attachment field.</exception>
    /// <sdkOperation>envelope.deleteEnvelopeFieldAttachment</sdkOperation>
    /// <sdkGroup>Envelope</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<EnvelopeField> DeleteFieldAttachmentAsync(
        string envelopeId,
        string roleName,
        string fieldName,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(envelopeId);
        ArgumentException.ThrowIfNullOrEmpty(roleName);
        ArgumentException.ThrowIfNullOrEmpty(fieldName);

        // The js-sdk sends a completely empty form here, but the server schema requires the
        // "value" key and rejects an empty body, so we send the lone empty text part instead.
        var form = new MultipartFormDataContent();
        form.Add(EmptyValuePart());

        return _endpoint.SendAsync<EnvelopeField>(HttpMethod.Put, FieldPath(envelopeId, roleName, fieldName), form, cancellationToken);
    }

    /// <summary>
    /// Gets a display URI for one page of an envelope document. Pages are rendered server-side
    /// into PNGs suitable for IMG tags; they are for display only, are not legally binding,
    /// and contain no participant metadata. The URI is signed with a short expiration, so use
    /// it immediately and never store or cache it. Accepts a user or signing session, and a
    /// signing session is blocked until the recipient completes their auth methods. The server
    /// also accepts the literal page "thumb" for a thumbnail, which this method (like the
    /// js-sdk) does not expose.
    ///
    /// <example>
    /// <code>
    /// var uri = await endpoint.Envelopes.GetDocumentPageDisplayUriAsync(documentId, 1);
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="documentId">The document to retrieve.</param>
    /// <param name="page">The page number to retrieve.</param>
    /// <param name="variant">The variant to render: "original", "filled", or "certificate".</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The page display URI.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because auth steps are incomplete.</exception>
    /// <sdkOperation>envelope.getEnvelopeDocumentPageDisplayUri</sdkOperation>
    /// <sdkGroup>Envelope</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<string> GetDocumentPageDisplayUriAsync(
        string documentId,
        int page,
        string variant = "original",
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(documentId);
        ArgumentException.ThrowIfNullOrEmpty(variant);
        return _endpoint.SendStringAsync(
            HttpMethod.Get,
            "/v2/envelope-documents/page-image/" + Uri.EscapeDataString(documentId)
                + "/" + Uri.EscapeDataString(variant)
                + "/" + page.ToString(CultureInfo.InvariantCulture),
            cancellationToken);
    }

    /// <summary>
    /// Generates a ZIP file containing all data for the specified envelopes: filled PDFs, the
    /// certificate, the combined PDF when present, and signer attachments under an
    /// attachments/ folder. The caller must be each envelope's owner or one of its recipients.
    /// The archive arrives as application/octet-stream. Large envelopes take a while to
    /// assemble, so configure the endpoint timeout accordingly (the js-sdk allows two
    /// minutes).
    ///
    /// <example>
    /// <code>
    /// var zip = await endpoint.Envelopes.GetZipAsync(new[] { envelopeId });
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="envelopeIds">The envelopes to include.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The raw ZIP bytes.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the caller is not a participant of every envelope.</exception>
    /// <sdkOperation>envelope.getEnvelopesZip</sdkOperation>
    /// <sdkGroup>Envelope</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<byte[]> GetZipAsync(IEnumerable<string> envelopeIds, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(envelopeIds);
        var ids = envelopeIds.Select(Uri.EscapeDataString).ToList();
        if (ids.Count == 0)
        {
            throw new ArgumentException("At least one envelope ID is required.", nameof(envelopeIds));
        }

        return _endpoint.SendBytesAsync(HttpMethod.Get, "/v2/envelopes/zip/" + string.Join(",", ids), cancellationToken);
    }

    /// <summary>
    /// Sorts fields in reading order: by page, then by Y coordinate in 5-unit bands (Y origin
    /// is the bottom-left corner, so bands sort descending), then by X coordinate. Sorts the
    /// list in place and returns it, like the js-sdk's sortFields. Local logic; no API call.
    ///
    /// <example>
    /// <code>
    /// Envelopes.SortFields(fields);
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="fields">The fields to sort. Modified in place.</param>
    /// <returns>The same list, sorted.</returns>
    /// <sdkOperation>envelope.sortFields</sdkOperation>
    /// <sdkGroup>Envelope</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
    public static List<EnvelopeField> SortFields(List<EnvelopeField> fields)
    {
        ArgumentNullException.ThrowIfNull(fields);

        // JavaScript sorts are stable, so ties keep their original order; List<T>.Sort is
        // not, hence the stable OrderBy and copy-back.
        var ordered = fields
            .OrderBy(field => field.Page)
            .ThenByDescending(field => Math.Floor((field.Y + field.Height) / 5))
            .ThenBy(field => field.X)
            .ToList();
        for (var i = 0; i < ordered.Count; i++)
        {
            fields[i] = ordered[i];
        }

        return fields;
    }

    /// <summary>
    /// Sorts documents by their order, falling back to creation date. Sorts the list in place
    /// and returns it, like the js-sdk's sortDocuments. Local logic; no API call.
    ///
    /// <example>
    /// <code>
    /// Envelopes.SortDocuments(documents);
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="documents">The documents to sort. Modified in place.</param>
    /// <returns>The same list, sorted.</returns>
    /// <sdkOperation>envelope.sortDocuments</sdkOperation>
    /// <sdkGroup>Envelope</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
    public static List<EnvelopeDocument> SortDocuments(List<EnvelopeDocument> documents)
    {
        ArgumentNullException.ThrowIfNull(documents);

        var ordered = documents
            .OrderBy(document => document.Order)
            .ThenBy(document => document.CreatedAt)
            .ToList();
        for (var i = 0; i < ordered.Count; i++)
        {
            documents[i] = ordered[i];
        }

        return documents;
    }

    /// <summary>
    /// Sorts recipients by sequence, then by order within the sequence. Sorts the list in
    /// place and returns it, like the js-sdk's sortRecipients; a null list passes through.
    /// Local logic; no API call.
    ///
    /// <example>
    /// <code>
    /// Envelopes.SortRecipients(recipients);
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="recipients">The recipients to sort. Modified in place.</param>
    /// <returns>The same list, sorted, or null if null was passed.</returns>
    /// <sdkOperation>envelope.sortRecipients</sdkOperation>
    /// <sdkGroup>Envelope</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
    public static List<Recipient>? SortRecipients(List<Recipient>? recipients)
    {
        if (recipients is null)
        {
            return null;
        }

        var ordered = recipients
            .OrderBy(recipient => recipient.Sequence)
            .ThenBy(recipient => recipient.Order)
            .ToList();
        for (var i = 0; i < ordered.Count; i++)
        {
            recipients[i] = ordered[i];
        }

        return recipients;
    }

    private static string FieldPath(string envelopeId, string roleName, string fieldName)
    {
        return "/v2/envelopes/" + Uri.EscapeDataString(envelopeId)
            + "/recipients/" + Uri.EscapeDataString(roleName)
            + "/fields/" + Uri.EscapeDataString(fieldName);
    }

    private static StringContent EmptyValuePart()
    {
        // The server's field-update schema requires the "value" key in every request,
        // multipart included, so uploads and removals both carry this empty text part. The
        // content type is cleared to match browser FormData text parts.
        var part = new StringContent(string.Empty);
        part.Headers.ContentType = null;
        part.Headers.ContentDisposition = new ContentDispositionHeaderValue("form-data") { Name = "\"value\"" };
        return part;
    }

    // A few document endpoints can stall while the server generates artifacts. The js-sdk
    // retries those exactly once on timeout and we mirror that.
    private static async Task<T> RetryOnceOnTimeoutAsync<T>(Func<Task<T>> request)
    {
        try
        {
            return await request().ConfigureAwait(false);
        }
        catch (TimeoutException)
        {
            return await request().ConfigureAwait(false);
        }
    }

    private static string BuildListPath(ListEnvelopesOptions? options)
    {
        const string path = "/v2/envelopes";
        if (options is null)
        {
            return path;
        }

        var parameters = new List<string>();

        void Add(string key, string value) => parameters.Add(key + "=" + Uri.EscapeDataString(value));

        if (options.Q is { } q)
        {
            Add("q", q);
        }

        if (options.View is { } view)
        {
            Add("view", view);
        }

        if (options.Status is { } status)
        {
            foreach (var value in status)
            {
                // The server reads the query with the qs extended parser and the schema wants
                // an array, so we send bracket notation exactly like axios does; a bare
                // status= key would parse as a string when only one value is sent.
                parameters.Add("status[]=" + Uri.EscapeDataString(value));
            }
        }

        if (options.IncludeOrg is { } includeOrg)
        {
            Add("include_org", includeOrg ? "true" : "false");
        }

        if (options.TemplateId is { } templateId)
        {
            Add("template_id", templateId);
        }

        if (options.CreatedBefore is { } createdBefore)
        {
            Add("created_before", createdBefore.ToString("O", CultureInfo.InvariantCulture));
        }

        if (options.CreatedAfter is { } createdAfter)
        {
            Add("created_after", createdAfter.ToString("O", CultureInfo.InvariantCulture));
        }

        if (options.SortBy is { } sortBy)
        {
            Add("sort_by", sortBy);
        }

        if (options.Ascending is { } ascending)
        {
            Add("ascending", ascending ? "true" : "false");
        }

        if (options.Rows is { } rows)
        {
            Add("rows", rows.ToString(CultureInfo.InvariantCulture));
        }

        if (options.Page is { } page)
        {
            Add("page", page.ToString(CultureInfo.InvariantCulture));
        }

        return parameters.Count == 0 ? path : path + "?" + string.Join("&", parameters);
    }
}
