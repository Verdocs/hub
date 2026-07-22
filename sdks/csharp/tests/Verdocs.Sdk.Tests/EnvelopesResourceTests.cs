using System.Globalization;
using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json.Nodes;
using Verdocs.Models;
using Verdocs.Resources;
using Xunit;

namespace Verdocs.Sdk.Tests;

/// <summary>Request shapes and response handling for the Envelopes resource.</summary>
public sealed class EnvelopesResourceTests
{
    private const string TestBaseUrl = "https://api.test";

    private const string EnvelopeJson = """
        {
          "id": "e1f2a3b4-c5d6-7890-abcd-ef0123456789",
          "status": "pending",
          "profile_id": "p-1",
          "organization_id": "o-1",
          "name": "Bill of Sale",
          "sender_name": "Del Egate",
          "sender_email": "del@example.com",
          "max_reminder_days": 14,
          "visibility": "private",
          "signed": false,
          "created_at": "2026-07-01T12:00:00Z",
          "updated_at": "2026-07-01T12:00:00Z"
        }
        """;

    private const string EnvelopeListJson = """{"count": 2, "rows": 20, "page": 0, "envelopes": [""" + EnvelopeJson + "]}";

    private const string DocumentJson = """
        {
          "id": "d-1",
          "envelope_id": "e1f2a3b4-c5d6-7890-abcd-ef0123456789",
          "order": 1,
          "type": "attachment",
          "name": "agreement.pdf",
          "pages": 3,
          "mime": "application/pdf",
          "size": 12345,
          "signed": false,
          "created_at": "2026-07-01T12:00:00Z",
          "updated_at": "2026-07-01T12:00:00Z"
        }
        """;

    private const string FieldJson = """
        {
          "envelope_id": "e1f2a3b4-c5d6-7890-abcd-ef0123456789",
          "document_id": "d-1",
          "name": "attachment-1",
          "role_name": "Seller",
          "type": "attachment",
          "required": true,
          "page": 1,
          "x": 72.5,
          "y": 100.0,
          "width": 100.0,
          "height": 50.0,
          "multiline": false,
          "is_valid": true
        }
        """;

    private static (Envelopes Envelopes, FakeHttpMessageHandler Handler) CreateResource(TimeSpan? timeout = null)
    {
        var handler = new FakeHttpMessageHandler();
        var client = new HttpClient(handler);
        var endpoint = new VerdocsEndpoint(new VerdocsEndpointOptions { BaseUrl = TestBaseUrl, Timeout = timeout }, client);
        return (new Envelopes(endpoint), handler);
    }

    private static HttpResponseMessage BytesResponse(byte[] bytes, string contentType)
    {
        var response = new HttpResponseMessage(HttpStatusCode.OK) { Content = new ByteArrayContent(bytes) };
        response.Content.Headers.ContentType = new MediaTypeHeaderValue(contentType);
        return response;
    }

    private static HttpResponseMessage TextResponse(string body, string contentType)
    {
        return new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent(body, Encoding.UTF8, contentType) };
    }

    [Fact]
    public async Task CreateAsync_TemplateRequest_PostsJsonAndKeepsEmailKeyForPhoneOnlyRecipients()
    {
        var (envelopes, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, EnvelopeJson);

        var response = await envelopes.CreateAsync(
            new CreateEnvelopeRequest
            {
                TemplateId = "t-1",
                Recipients =
                [
                    new CreateEnvelopeRecipient
                    {
                        RoleName = "Seller",
                        FirstName = "Paige",
                        LastName = "Turner",
                        Phone = "+15555550100",
                    },
                    new CreateEnvelopeRecipient
                    {
                        Type = "signer",
                        RoleName = "Buyer",
                        FirstName = "Will",
                        LastName = "Power",
                        Email = "will.power@example.com",
                        Sequence = 2,
                        AuthMethods = ["sms"],
                        PhoneAuth = "+15555550101",
                    },
                ],
            },
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Post, request.Method);
        Assert.Equal("/v2/envelopes", request.Uri!.PathAndQuery);

        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        Assert.Equal("t-1", (string?)body["template_id"]);
        Assert.False(body.ContainsKey("name"));
        Assert.False(body.ContainsKey("documents"));

        var recipients = Assert.IsType<JsonArray>(body["recipients"]);
        var phoneOnly = Assert.IsType<JsonObject>(recipients[0]);
        // The server requires the email key on every recipient, so a phone-only entry must
        // still serialize email as an empty string rather than omitting it.
        Assert.True(phoneOnly.ContainsKey("email"));
        Assert.Equal("", (string?)phoneOnly["email"]);
        Assert.Equal("+15555550100", (string?)phoneOnly["phone"]);
        Assert.False(phoneOnly.ContainsKey("type"));
        Assert.False(phoneOnly.ContainsKey("sequence"));

        var full = Assert.IsType<JsonObject>(recipients[1]);
        Assert.Equal("signer", (string?)full["type"]);
        Assert.Equal(2, (int?)full["sequence"]);
        Assert.Equal("sms", (string?)full["auth_methods"]![0]);
        Assert.Equal("+15555550101", (string?)full["phone_auth"]);

        Assert.Equal("e1f2a3b4-c5d6-7890-abcd-ef0123456789", response.Id);
    }

    [Fact]
    public async Task CreateAsync_DirectRequest_SendsDocumentsFieldsAndReminders()
    {
        var (envelopes, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, EnvelopeJson);

        await envelopes.CreateAsync(
            new CreateEnvelopeRequest
            {
                Name = "Direct Envelope",
                InitialReminder = 86_400_000,
                FollowupReminders = 0,
                Recipients =
                [
                    new CreateEnvelopeRecipient
                    {
                        RoleName = "Signer 1",
                        FirstName = "Ann",
                        LastName = "Other",
                        Email = "ann@example.com",
                        SsnLast4 = "1234",
                    },
                ],
                Documents = [new CreateEnvelopeDocument { Name = "doc.pdf", Data = "JVBERi0=" }],
                Fields =
                [
                    new CreateEnvelopeField
                    {
                        DocumentId = 0,
                        Name = "sig-1",
                        RoleName = "Signer 1",
                        Type = "signature",
                        Page = 1,
                        X = 10,
                        Y = 20,
                    },
                ],
            },
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        Assert.False(body.ContainsKey("template_id"));
        Assert.Equal("Direct Envelope", (string?)body["name"]);
        Assert.Equal(86_400_000, (long?)body["initial_reminder"]);
        Assert.Equal(0, (long?)body["followup_reminders"]);
        Assert.Equal("JVBERi0=", (string?)body["documents"]![0]!["data"]);
        Assert.Equal("1234", (string?)body["recipients"]![0]!["ssn_last_4"]);

        var field = Assert.IsType<JsonObject>(body["fields"]![0]);
        Assert.Equal(0, (int?)field["document_id"]);
        Assert.Equal("Signer 1", (string?)field["role_name"]);
        Assert.Equal("signature", (string?)field["type"]);
        Assert.False(field.ContainsKey("width"));
    }

    [Fact]
    public void CreateAsync_NullRequest_ThrowsSynchronously()
    {
        var (envelopes, _) = CreateResource();

        Assert.Throws<ArgumentNullException>(
            () => { _ = envelopes.CreateAsync(null!, TestContext.Current.CancellationToken); });
    }

    [Fact]
    public async Task GetAsync_RequestsEnvelopeById_ParsesEnvelope()
    {
        var (envelopes, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, EnvelopeJson);

        var envelope = await envelopes.GetAsync("e1f2a3b4-c5d6-7890-abcd-ef0123456789", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Get, request.Method);
        Assert.Equal("/v2/envelopes/e1f2a3b4-c5d6-7890-abcd-ef0123456789", request.Uri!.PathAndQuery);
        Assert.Equal("Bill of Sale", envelope.Name);
        Assert.Equal("pending", envelope.Status);
        // Relations the response omits stay null rather than empty.
        Assert.Null(envelope.Recipients);
    }

    [Fact]
    public void GetAsync_EmptyId_ThrowsSynchronously()
    {
        var (envelopes, _) = CreateResource();

        Assert.Throws<ArgumentException>(
            () => { _ = envelopes.GetAsync("", TestContext.Current.CancellationToken); });
    }

    [Fact]
    public async Task ListAsync_NoOptions_RequestsBarePath()
    {
        var (envelopes, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, EnvelopeListJson);

        await envelopes.ListAsync(cancellationToken: TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal("/v2/envelopes", request.Uri!.PathAndQuery);
    }

    [Fact]
    public async Task ListAsync_AllOptions_BuildsQueryWithBracketedStatusArray()
    {
        var (envelopes, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, EnvelopeListJson);
        var createdBefore = new DateTimeOffset(2026, 7, 1, 0, 0, 0, TimeSpan.Zero);
        var createdAfter = new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero);

        await envelopes.ListAsync(
            new ListEnvelopesOptions
            {
                Q = "bill of sale",
                View = "inbox",
                Status = ["pending", "in progress"],
                IncludeOrg = true,
                TemplateId = "t-1",
                CreatedBefore = createdBefore,
                CreatedAfter = createdAfter,
                SortBy = "created_at",
                Ascending = false,
                Rows = 50,
                Page = 2,
            },
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        // status[] uses bracket notation like axios; the server's qs parser needs it to see
        // an array even when a single value is sent.
        var expected = "/v2/envelopes?q=bill%20of%20sale&view=inbox&status[]=pending&status[]=in%20progress"
            + "&include_org=true&template_id=t-1"
            + "&created_before=" + Uri.EscapeDataString(createdBefore.ToString("O", CultureInfo.InvariantCulture))
            + "&created_after=" + Uri.EscapeDataString(createdAfter.ToString("O", CultureInfo.InvariantCulture))
            + "&sort_by=created_at&ascending=false&rows=50&page=2";
        Assert.Equal(expected, request.Uri!.PathAndQuery);
    }

    [Fact]
    public async Task ListAsync_ParsesEnvelopeList()
    {
        var (envelopes, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, EnvelopeListJson);

        var list = await envelopes.ListAsync(cancellationToken: TestContext.Current.CancellationToken);

        Assert.Equal(2, list.Count);
        Assert.Equal(20, list.Rows);
        Assert.Equal(0, list.Page);
        var envelope = Assert.Single(list.Envelopes);
        Assert.Equal("Bill of Sale", envelope.Name);
    }

    [Fact]
    public async Task UpdateAsync_PatchesOnlySetFields()
    {
        var (envelopes, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, EnvelopeJson);

        await envelopes.UpdateAsync(
            "e-1",
            new UpdateEnvelopeRequest { Name = "Renamed", NoContact = true },
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Patch, request.Method);
        Assert.Equal("/v2/envelopes/e-1", request.Uri!.PathAndQuery);

        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        Assert.Equal("Renamed", (string?)body["name"]);
        Assert.True((bool?)body["no_contact"]);
        Assert.False(body.ContainsKey("sender_name"));
        Assert.False(body.ContainsKey("data"));
    }

    [Fact]
    public async Task CancelAsync_PutsCancelAction()
    {
        var (envelopes, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, EnvelopeJson);

        var envelope = await envelopes.CancelAsync("e-1", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Put, request.Method);
        Assert.Equal("/v2/envelopes/e-1", request.Uri!.PathAndQuery);
        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        Assert.Equal("cancel", (string?)body["action"]);
        Assert.Equal("Bill of Sale", envelope.Name);
    }

    [Fact]
    public async Task GetDocumentAsync_ParsesMetadataDeliveredAsText()
    {
        var (envelopes, handler) = CreateResource();
        // The server sends document metadata as JSON.stringify output under text/html; the
        // resource must parse the body regardless of the declared content type.
        handler.Enqueue((_, _) => Task.FromResult(TextResponse(DocumentJson, "text/html")));

        var document = await envelopes.GetDocumentAsync("d-1", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal("/v2/envelope-documents/d-1", request.Uri!.PathAndQuery);
        Assert.Equal("agreement.pdf", document.Name);
        Assert.Equal(3, document.Pages);
    }

    [Fact]
    public async Task DownloadDocumentAsync_ReturnsRawBytes()
    {
        var (envelopes, handler) = CreateResource();
        handler.Enqueue((_, _) => Task.FromResult(BytesResponse([0x25, 0x50, 0x44, 0x46], "application/pdf")));

        var bytes = await envelopes.DownloadDocumentAsync("d-1", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal("/v2/envelope-documents/d-1?type=file", request.Uri!.PathAndQuery);
        Assert.Equal(new byte[] { 0x25, 0x50, 0x44, 0x46 }, bytes);
    }

    [Fact]
    public async Task DownloadDocumentAsync_FirstAttemptTimesOut_RetriesOnce()
    {
        var (envelopes, handler) = CreateResource(TimeSpan.FromMilliseconds(250));

        handler.Enqueue(async (_, cancellationToken) =>
        {
            // Outlives the 250 ms endpoint timeout, so the transport raises TimeoutException
            // and the resource retries once, mirroring the js-sdk's retryOnceOnTimeout.
            await Task.Delay(TimeSpan.FromSeconds(10), cancellationToken);
            return new HttpResponseMessage(HttpStatusCode.OK);
        });
        handler.Enqueue((_, _) => Task.FromResult(BytesResponse([1, 2, 3], "application/pdf")));

        var bytes = await envelopes.DownloadDocumentAsync("d-1", TestContext.Current.CancellationToken);

        Assert.Equal(2, handler.Requests.Count);
        Assert.Equal(new byte[] { 1, 2, 3 }, bytes);
    }

    [Fact]
    public async Task GetDocumentDownloadLinkAsync_ReturnsBareUrlString()
    {
        var (envelopes, handler) = CreateResource();
        handler.Enqueue((_, _) => Task.FromResult(TextResponse("https://cdn.test/signed-url", "text/html")));

        var link = await envelopes.GetDocumentDownloadLinkAsync("d-1", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal("/v2/envelope-documents/d-1?type=download", request.Uri!.PathAndQuery);
        Assert.Equal("https://cdn.test/signed-url", link);
    }

    [Fact]
    public async Task GetCombinedDocumentDownloadLinkAsync_AddsCombinedFlag()
    {
        var (envelopes, handler) = CreateResource();
        handler.Enqueue((_, _) => Task.FromResult(TextResponse("https://cdn.test/combined-url", "text/html")));

        var link = await envelopes.GetCombinedDocumentDownloadLinkAsync("d-1", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal("/v2/envelope-documents/d-1?type=download&combined=true", request.Uri!.PathAndQuery);
        Assert.Equal("https://cdn.test/combined-url", link);
    }

    [Fact]
    public async Task GetDocumentPreviewLinkAsync_RequestsPreviewType()
    {
        var (envelopes, handler) = CreateResource();
        handler.Enqueue((_, _) => Task.FromResult(TextResponse("https://cdn.test/preview-url", "text/html")));

        var link = await envelopes.GetDocumentPreviewLinkAsync("d-1", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal("/v2/envelope-documents/d-1?type=preview", request.Uri!.PathAndQuery);
        Assert.Equal("https://cdn.test/preview-url", link);
    }

    [Fact]
    public async Task GetFileAsync_ReturnsRawBytes()
    {
        var (envelopes, handler) = CreateResource();
        handler.Enqueue((_, _) => Task.FromResult(BytesResponse([9, 8, 7], "application/pdf")));

#pragma warning disable CS0618 // GetFileAsync mirrors the js-sdk's deprecated getEnvelopeFile and still needs coverage.
        var bytes = await envelopes.GetFileAsync("d-1", TestContext.Current.CancellationToken);
#pragma warning restore CS0618

        var request = Assert.Single(handler.Requests);
        Assert.Equal("/v2/envelope-documents/d-1?type=file", request.Uri!.PathAndQuery);
        Assert.Equal(new byte[] { 9, 8, 7 }, bytes);
    }

    [Fact]
    public async Task UpdateFieldAsync_PutsValueAndPrepared_EncodesPathSegments()
    {
        var (envelopes, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, FieldJson);

        var field = await envelopes.UpdateFieldAsync(
            "e-1",
            "Recipient 1",
            "initial-1",
            "block-uuid-1",
            prepared: false,
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Put, request.Method);
        Assert.Equal("/v2/envelopes/e-1/recipients/Recipient%201/fields/initial-1", request.Uri!.PathAndQuery);

        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        Assert.Equal("block-uuid-1", (string?)body["value"]);
        Assert.False((bool?)body["prepared"]);
        Assert.Equal("attachment-1", field.Name);
    }

    [Fact]
    public async Task UploadFieldAttachmentAsync_SendsDocumentPartAndEmptyValuePart()
    {
        var (envelopes, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, FieldJson);
        using var content = new MemoryStream(Encoding.ASCII.GetBytes("PDFDATA"));

        var field = await envelopes.UploadFieldAttachmentAsync(
            "e-1",
            "Seller",
            "attachment-1",
            content,
            "agreement.pdf",
            "application/pdf",
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Put, request.Method);
        Assert.Equal("/v2/envelopes/e-1/recipients/Seller/fields/attachment-1", request.Uri!.PathAndQuery);

        var body = request.Body!;
        Assert.Contains("name=\"document\"", body);
        Assert.Contains("filename=\"agreement.pdf\"", body);
        Assert.Contains("Content-Type: application/pdf", body);
        Assert.Contains("PDFDATA", body);
        // The server schema requires the value key even alongside a file part.
        Assert.Contains("name=\"value\"", body);
        Assert.Equal("attachment-1", field.Name);
    }

    [Fact]
    public async Task UploadFieldAttachmentAsync_NoContentType_DefaultsToOctetStream()
    {
        var (envelopes, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, FieldJson);
        using var content = new MemoryStream(Encoding.ASCII.GetBytes("DATA"));

        await envelopes.UploadFieldAttachmentAsync(
            "e-1",
            "Seller",
            "attachment-1",
            content,
            "notes.bin",
            cancellationToken: TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Contains("Content-Type: application/octet-stream", request.Body!);
    }

    [Fact]
    public async Task DeleteFieldAttachmentAsync_SendsLoneEmptyValuePart()
    {
        var (envelopes, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, FieldJson);

        var field = await envelopes.DeleteFieldAttachmentAsync("e-1", "Seller", "attachment-1", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Put, request.Method);
        Assert.Equal("/v2/envelopes/e-1/recipients/Seller/fields/attachment-1", request.Uri!.PathAndQuery);

        // Omitting the file is what triggers removal, but the value part must stay: the
        // js-sdk's truly empty form draws a 400 from the server schema.
        var body = request.Body!;
        Assert.Contains("name=\"value\"", body);
        Assert.DoesNotContain("name=\"document\"", body);
        Assert.DoesNotContain("filename=", body);
        Assert.Equal("attachment-1", field.Name);
    }

    [Fact]
    public async Task GetDocumentPageDisplayUriAsync_DefaultVariant_BuildsPath()
    {
        var (envelopes, handler) = CreateResource();
        handler.Enqueue((_, _) => Task.FromResult(TextResponse("https://cdn.test/page-url", "text/html")));

        var link = await envelopes.GetDocumentPageDisplayUriAsync("d-1", 2, cancellationToken: TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal("/v2/envelope-documents/page-image/d-1/original/2", request.Uri!.PathAndQuery);
        Assert.Equal("https://cdn.test/page-url", link);
    }

    [Fact]
    public async Task GetDocumentPageDisplayUriAsync_CertificateVariant_BuildsPath()
    {
        var (envelopes, handler) = CreateResource();
        handler.Enqueue((_, _) => Task.FromResult(TextResponse("https://cdn.test/cert-url", "text/html")));

        await envelopes.GetDocumentPageDisplayUriAsync("d-1", 0, "certificate", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal("/v2/envelope-documents/page-image/d-1/certificate/0", request.Uri!.PathAndQuery);
    }

    [Fact]
    public async Task GetZipAsync_JoinsIdsWithCommas_ReturnsBytes()
    {
        var (envelopes, handler) = CreateResource();
        handler.Enqueue((_, _) => Task.FromResult(BytesResponse([0x50, 0x4B, 0x03, 0x04], "application/octet-stream")));

        var bytes = await envelopes.GetZipAsync(["e-1", "e-2"], TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal("/v2/envelopes/zip/e-1,e-2", request.Uri!.PathAndQuery);
        Assert.Equal(new byte[] { 0x50, 0x4B, 0x03, 0x04 }, bytes);
    }

    [Fact]
    public void GetZipAsync_EmptyIds_ThrowsSynchronously()
    {
        var (envelopes, _) = CreateResource();

        Assert.Throws<ArgumentException>(
            () => { _ = envelopes.GetZipAsync([], TestContext.Current.CancellationToken); });
    }

    [Fact]
    public void SortFields_OrdersByPageThenBandThenX()
    {
        var fields = new List<EnvelopeField>
        {
            new() { Name = "page2", Page = 2, X = 0, Y = 0, Height = 0 },
            new() { Name = "band20-x50", Page = 1, X = 50, Y = 100, Height = 0 },
            new() { Name = "band20-x10", Page = 1, X = 10, Y = 100, Height = 0 },
            new() { Name = "band2", Page = 1, X = 0, Y = 10, Height = 0 },
        };

        var result = Envelopes.SortFields(fields);

        Assert.Same(fields, result);
        // Y coordinates have their origin at the bottom-left corner, so higher bands come
        // first within a page.
        Assert.Equal(["band20-x10", "band20-x50", "band2", "page2"], fields.Select(field => field.Name).ToArray());
    }

    [Fact]
    public void SortDocuments_OrdersByOrderThenCreatedAt()
    {
        var earlier = new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero);
        var later = new DateTimeOffset(2026, 6, 1, 0, 0, 0, TimeSpan.Zero);
        var documents = new List<EnvelopeDocument>
        {
            new() { Id = "b", Order = 1, CreatedAt = later },
            new() { Id = "a", Order = 1, CreatedAt = earlier },
            new() { Id = "c", Order = 0, CreatedAt = later },
        };

        var result = Envelopes.SortDocuments(documents);

        Assert.Same(documents, result);
        Assert.Equal(["c", "a", "b"], documents.Select(document => document.Id).ToArray());
    }

    [Fact]
    public void SortRecipients_OrdersBySequenceThenOrder()
    {
        var recipients = new List<Recipient>
        {
            new() { RoleName = "third", Sequence = 2, Order = 1 },
            new() { RoleName = "second", Sequence = 1, Order = 2 },
            new() { RoleName = "first", Sequence = 1, Order = 1 },
        };

        var result = Envelopes.SortRecipients(recipients);

        Assert.Same(recipients, result);
        Assert.Equal(["first", "second", "third"], recipients.Select(recipient => recipient.RoleName).ToArray());
    }

    [Fact]
    public void SortRecipients_NullList_ReturnsNull()
    {
        Assert.Null(Envelopes.SortRecipients(null));
    }

    [Fact]
    public void DefaultDisclosures_MatchesJsSdkText()
    {
        Assert.StartsWith("\n<ul>", Disclosures.Default, StringComparison.Ordinal);
        Assert.EndsWith("</ul>", Disclosures.Default, StringComparison.Ordinal);
        Assert.Contains("https://verdocs.com/en/electronic-record-signature-disclosure/", Disclosures.Default, StringComparison.Ordinal);
        Assert.Contains("https://verdocs.com/en/eula", Disclosures.Default, StringComparison.Ordinal);
        Assert.Contains("https://verdocs.com/en/privacy-policy/", Disclosures.Default, StringComparison.Ordinal);
    }
}
