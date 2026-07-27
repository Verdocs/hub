using System.Net.Http.Headers;
using Verdocs.Models;

namespace Verdocs.Resources;

/// <summary>
/// Signature block calls, reached through the endpoint's Signatures property.
/// </summary>
public sealed class Signatures
{
    private readonly VerdocsEndpoint _endpoint;

    internal Signatures(VerdocsEndpoint endpoint)
    {
        _endpoint = endpoint;
    }

    /// <summary>
    /// Creates a signature block from an image. Signers typically adopt one signature block at
    /// the start of signing, then reuse its ID for every signature field to be stamped (via
    /// the envelope field update). Accepts a user or a signing session: guest signers get an
    /// auto-created profile and typically hold one block tied to that session, while
    /// authenticated users can keep several and use them interchangeably. The stored image is
    /// not fetchable through the v2 API; the block's ID is what matters.
    /// </summary>
    /// <param name="content">The signature image to store.</param>
    /// <param name="fileName">The filename to store with the image.</param>
    /// <param name="contentType">The image's MIME type. Defaults to application/octet-stream; the server stores the declared type without validating it.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The newly created signature block.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the session is invalid.</exception>
    /// <sdkOperation>signature.createSignature</sdkOperation>
    /// <sdkGroup>Signature</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<Signature> CreateAsync(
        Stream content,
        string fileName,
        string? contentType = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(content);
        ArgumentException.ThrowIfNullOrEmpty(fileName);

        var form = new MultipartFormDataContent();
        var part = new StreamContent(content);
        part.Headers.ContentType = new MediaTypeHeaderValue(contentType ?? "application/octet-stream");
        // Browsers always quote part names and filenames while .NET leaves token-safe values
        // unquoted, so we pre-quote to keep the wire shape identical to the js-sdk's.
        part.Headers.ContentDisposition = new ContentDispositionHeaderValue("form-data")
        {
            Name = "\"signature\"",
            FileName = "\"" + fileName + "\"",
        };
        form.Add(part);

        return _endpoint.SendAsync<Signature>(HttpMethod.Post, "/v2/profiles/signatures", form, cancellationToken);
    }
}
