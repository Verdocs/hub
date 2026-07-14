using System.Net;
using System.Net.Http.Headers;
using System.Text;
using Verdocs.Models;
using Verdocs.Resources;
using Xunit;

namespace Verdocs.Sdk.Tests;

/// <summary>Request shapes and response handling for the TemplateDocuments resource.</summary>
public sealed class TemplateDocumentsTests
{
    private const string TestBaseUrl = "https://api.test";

    // Payloads are defined locally; SamplePayloads.cs belongs to another slice.
    private const string TemplateDocumentJson = """
    {
      "id": "9a1f21dc-31c7-4d55-95a8-6a0f2f8b1c44",
      "name": "lease.pdf",
      "template_id": "0df79afe-76b9-417f-a1b3-d51c7abffb6f",
      "order": 0,
      "pages": 3,
      "mime": "application/pdf",
      "size": 182734,
      "created_at": "2026-02-01T10:00:00Z",
      "updated_at": "2026-02-01T10:00:00Z"
    }
    """;

    private const string TemplateJson = """
    {
      "id": "0df79afe-76b9-417f-a1b3-d51c7abffb6f",
      "profile_id": "6d5eba25-ecb4-4a94-b7d1-a5c22a19d2b9",
      "organization_id": "b2a30b2e-a1a6-4b52-b103-3e4a4c22bba7",
      "sender": "envelope_creator",
      "name": "Lease Agreement",
      "counter": 0,
      "star_counter": 0,
      "is_sendable": false,
      "created_at": "2026-02-01T10:00:00Z",
      "updated_at": "2026-02-01T10:00:00Z",
      "documents": []
    }
    """;

    private static (TemplateDocuments Documents, FakeHttpMessageHandler Handler) CreateResource()
    {
        var handler = new FakeHttpMessageHandler();
        var client = new HttpClient(handler);
        var endpoint = new VerdocsEndpoint(new VerdocsEndpointOptions { BaseUrl = TestBaseUrl }, client);
        // The endpoint property for this resource is wired by the coordinator; tests construct
        // the resource directly through its internal constructor.
        return (new TemplateDocuments(endpoint), handler);
    }

    [Fact]
    public async Task CreateAsync_Upload_SendsMultipartFileAndTemplateIdParts()
    {
        var (documents, handler) = CreateResource();
        string? contentTypeHeader = null;
        handler.Enqueue((request, _) =>
        {
            contentTypeHeader = request.Content?.Headers.ContentType?.ToString();
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(TemplateDocumentJson, Encoding.UTF8, "application/json"),
            });
        });

        using var file = new MemoryStream(Encoding.ASCII.GetBytes("%PDF-1.4 lease"));
        var document = await documents.CreateAsync(
            "0df79afe-76b9-417f-a1b3-d51c7abffb6f",
            new TemplateFileUpload { Content = file, FileName = "lease.pdf", ContentType = "application/pdf" },
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Post, request.Method);
        Assert.Equal("/v2/template-documents", request.Uri!.PathAndQuery);

        Assert.NotNull(contentTypeHeader);
        var contentType = MediaTypeHeaderValue.Parse(contentTypeHeader);
        Assert.Equal("multipart/form-data", contentType.MediaType);
        var boundary = Assert.Single(contentType.Parameters, parameter => parameter.Name == "boundary").Value!.Trim('"');
        Assert.False(string.IsNullOrEmpty(boundary));
        Assert.StartsWith("--" + boundary, request.Body!);

        // Exactly one file part named "file" plus the template_id text part; the handler
        // ignores every other text part and rejects other file names.
        Assert.Contains("name=\"file\"", request.Body);
        Assert.Contains("filename=\"lease.pdf\"", request.Body);
        Assert.Contains("Content-Type: application/pdf", request.Body);
        Assert.Contains("name=\"template_id\"", request.Body);
        Assert.Contains("0df79afe-76b9-417f-a1b3-d51c7abffb6f", request.Body);
        Assert.Contains("%PDF-1.4 lease", request.Body);

        Assert.Equal("lease.pdf", document.Name);
        Assert.Equal(3, document.Pages);
    }

    [Fact]
    public async Task GetAsync_TextHtmlContentType_ParsesMetadataAnyway()
    {
        var (documents, handler) = CreateResource();
        // The server sends this JSON with a text/html content type; parsing must not depend
        // on the header.
        handler.Enqueue((_, _) => Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(TemplateDocumentJson, Encoding.UTF8, "text/html"),
        }));

        var document = await documents.GetAsync("9a1f21dc-31c7-4d55-95a8-6a0f2f8b1c44", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Get, request.Method);
        Assert.Equal("/v2/template-documents/9a1f21dc-31c7-4d55-95a8-6a0f2f8b1c44", request.Uri!.PathAndQuery);
        Assert.Equal("lease.pdf", document.Name);
        Assert.Equal("application/pdf", document.Mime);
    }

    [Fact]
    public async Task DownloadAsync_TypeFileQuery_ReturnsRawBytes()
    {
        var (documents, handler) = CreateResource();
        var pdfBytes = Encoding.ASCII.GetBytes("%PDF-1.4 raw bytes");
        handler.Enqueue((_, _) =>
        {
            var response = new HttpResponseMessage(HttpStatusCode.OK) { Content = new ByteArrayContent(pdfBytes) };
            response.Content.Headers.ContentType = new MediaTypeHeaderValue("application/pdf");
            return Task.FromResult(response);
        });

        var bytes = await documents.DownloadAsync("9a1f21dc-31c7-4d55-95a8-6a0f2f8b1c44", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Get, request.Method);
        Assert.Equal("/v2/template-documents/9a1f21dc-31c7-4d55-95a8-6a0f2f8b1c44?type=file", request.Uri!.PathAndQuery);
        Assert.Equal(pdfBytes, bytes);
    }

    [Fact]
    public async Task GetDownloadLinkAsync_TypeDownloadQuery_ReturnsBareUrl()
    {
        var (documents, handler) = CreateResource();
        // The link endpoints answer with a bare URL string, not JSON.
        handler.Enqueue((_, _) => Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent("https://docs.cdn.test/signed/lease.pdf?Expires=1", Encoding.UTF8, "text/plain"),
        }));

        var link = await documents.GetDownloadLinkAsync("9a1f21dc-31c7-4d55-95a8-6a0f2f8b1c44", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal("/v2/template-documents/9a1f21dc-31c7-4d55-95a8-6a0f2f8b1c44?type=download", request.Uri!.PathAndQuery);
        Assert.Equal("https://docs.cdn.test/signed/lease.pdf?Expires=1", link);
    }

    [Fact]
    public async Task GetPreviewLinkAsync_MirrorsJsSdk_RequestsEnvelopeDocumentsPath()
    {
        var (documents, handler) = CreateResource();
        handler.Enqueue((_, _) => Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent("https://docs.cdn.test/signed/preview.pdf", Encoding.UTF8, "text/plain"),
        }));

        var link = await documents.GetPreviewLinkAsync("9a1f21dc-31c7-4d55-95a8-6a0f2f8b1c44", TestContext.Current.CancellationToken);

        // Anomaly preserved from the js-sdk: the preview link targets the envelope-documents
        // family, not template-documents.
        var request = Assert.Single(handler.Requests);
        Assert.Equal("/v2/envelope-documents/9a1f21dc-31c7-4d55-95a8-6a0f2f8b1c44?type=preview", request.Uri!.PathAndQuery);
        Assert.Equal("https://docs.cdn.test/signed/preview.pdf", link);
    }

    [Fact]
    public async Task GetFileAsync_DeadLegacyRoute_RequestsJsSdkPath()
    {
        var (documents, handler) = CreateResource();
        handler.Enqueue((_, _) => Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new ByteArrayContent(Encoding.ASCII.GetBytes("%PDF-1.4")),
        }));

        await documents.GetFileAsync(
            "0df79afe-76b9-417f-a1b3-d51c7abffb6f",
            "9a1f21dc-31c7-4d55-95a8-6a0f2f8b1c44",
            TestContext.Current.CancellationToken);

        // The deployed API has no such route (it 404s); the port keeps the js-sdk shape until
        // the function is retired, so the request must match the js-sdk exactly.
        var request = Assert.Single(handler.Requests);
        Assert.Equal(
            "/v2/templates/0df79afe-76b9-417f-a1b3-d51c7abffb6f/documents/9a1f21dc-31c7-4d55-95a8-6a0f2f8b1c44?file=true",
            request.Uri!.PathAndQuery);
    }

    [Fact]
    public async Task GetThumbnailAsync_DeadLegacyRoute_RequestsJsSdkPath()
    {
        var (documents, handler) = CreateResource();
        handler.Enqueue((_, _) => Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new ByteArrayContent(Encoding.ASCII.GetBytes("PNG")),
        }));

        await documents.GetThumbnailAsync(
            "0df79afe-76b9-417f-a1b3-d51c7abffb6f",
            "9a1f21dc-31c7-4d55-95a8-6a0f2f8b1c44",
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(
            "/v2/templates/0df79afe-76b9-417f-a1b3-d51c7abffb6f/documents/9a1f21dc-31c7-4d55-95a8-6a0f2f8b1c44?thumbnail=true",
            request.Uri!.PathAndQuery);
    }

    [Fact]
    public async Task GetPageDisplayUriAsync_BuildsPageImagePathAndReturnsUrl()
    {
        var (documents, handler) = CreateResource();
        handler.Enqueue((_, _) => Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent("https://docs.cdn.test/pages/2.png", Encoding.UTF8, "text/plain"),
        }));

        var uri = await documents.GetPageDisplayUriAsync(
            "9a1f21dc-31c7-4d55-95a8-6a0f2f8b1c44",
            2,
            "tagged",
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal("/v2/template-documents/page-image/9a1f21dc-31c7-4d55-95a8-6a0f2f8b1c44/tagged/2", request.Uri!.PathAndQuery);
        Assert.Equal("https://docs.cdn.test/pages/2.png", uri);
    }

    [Fact]
    public async Task DeleteAsync_ReturnsRemainingDeepTemplate()
    {
        var (documents, handler) = CreateResource();
        // Deleting a document answers with the remaining deep template, not a status string.
        handler.Enqueue(HttpStatusCode.OK, TemplateJson);

        var template = await documents.DeleteAsync("9a1f21dc-31c7-4d55-95a8-6a0f2f8b1c44", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Delete, request.Method);
        Assert.Equal("/v2/template-documents/9a1f21dc-31c7-4d55-95a8-6a0f2f8b1c44", request.Uri!.PathAndQuery);
        Assert.Equal("Lease Agreement", template.Name);
        Assert.Empty(template.Documents!);
    }
}
