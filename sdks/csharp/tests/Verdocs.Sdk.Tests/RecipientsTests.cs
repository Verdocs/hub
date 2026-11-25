using System.Net;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Verdocs.Models;
using Verdocs.Resources;
using Xunit;

namespace Verdocs.Sdk.Tests;

/// <summary>Request shapes and response handling for the Recipients resource.</summary>
public sealed class RecipientsTests
{
    private const string TestBaseUrl = "https://api.test";

    private const string RecipientJson = """
        {
          "envelope_id": "e-1",
          "role_name": "Recipient 1",
          "status": "invited",
          "first_name": "Paige",
          "last_name": "Turner",
          "email": "paige@example.com",
          "sequence": 1,
          "order": 1,
          "type": "signer",
          "delegator": false,
          "claimed": false,
          "agreed": false,
          "name_locked": false,
          "created_at": "2026-07-01T12:00:00Z",
          "updated_at": "2026-07-01T12:00:00Z"
        }
        """;

    private const string EnvelopeJson = """
        {
          "id": "e-1",
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

    private static (Recipients Recipients, FakeHttpMessageHandler Handler, VerdocsEndpoint Endpoint) CreateResource()
    {
        var handler = new FakeHttpMessageHandler();
        var client = new HttpClient(handler);
        var endpoint = new VerdocsEndpoint(new VerdocsEndpointOptions { BaseUrl = TestBaseUrl }, client);
        return (new Recipients(endpoint), handler, endpoint);
    }

    [Fact]
    public async Task AgreeAsync_PostsDisclosuresAndLocaleDetails()
    {
        var (recipients, handler, _) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, RecipientJson);

        var recipient = await recipients.AgreeAsync(
            "e-1",
            "Recipient 1",
            Disclosures.Default,
            new RecipientDisclosureAgreeBody { Locale = "en-US", Timezone = "America/Phoenix" },
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Post, request.Method);
        Assert.Equal("/v2/envelopes/e-1/recipients/Recipient%201/agree", request.Uri!.PathAndQuery);

        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        Assert.Equal(Disclosures.Default, (string?)body["disclosures"]);
        Assert.Equal("en-US", (string?)body["locale"]);
        Assert.Equal("America/Phoenix", (string?)body["timezone"]);
        Assert.Equal("Recipient 1", recipient.RoleName);
    }

    [Fact]
    public async Task AgreeAsync_NoOptionals_PostsEmptyObject()
    {
        var (recipients, handler, _) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, RecipientJson);

        await recipients.AgreeAsync("e-1", "Recipient 1", cancellationToken: TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        // The js-sdk sends {disclosures: undefined, ...data} which serializes to {}; unset
        // properties must stay off the wire here too.
        Assert.Equal("{}", request.Body);
    }

    [Fact]
    public async Task DeclineAsync_PostsWithNoBody()
    {
        var (recipients, handler, _) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, RecipientJson);

        var recipient = await recipients.DeclineAsync("e-1", "Recipient 1", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Post, request.Method);
        Assert.Equal("/v2/envelopes/e-1/recipients/Recipient%201/decline", request.Uri!.PathAndQuery);
        Assert.Null(request.Body);
        Assert.Equal("invited", recipient.Status);
    }

    [Fact]
    public async Task SubmitAsync_PostsLocaleDetails()
    {
        var (recipients, handler, _) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, RecipientJson);

        await recipients.SubmitAsync(
            "e-1",
            "Recipient 1",
            new RecipientSubmitBody { Locale = "en-US" },
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal("/v2/envelopes/e-1/recipients/Recipient%201/submit", request.Uri!.PathAndQuery);
        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        Assert.Equal("en-US", (string?)body["locale"]);
        Assert.False(body.ContainsKey("timezone"));
    }

    [Fact]
    public async Task SubmitAsync_NoData_PostsWithNoBody()
    {
        var (recipients, handler, _) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, RecipientJson);

        await recipients.SubmitAsync("e-1", "Recipient 1", cancellationToken: TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Null(request.Body);
    }

    [Fact]
    public async Task StartSigningSessionAsync_StoresSigningTokenOnEndpoint()
    {
        var (recipients, handler, endpoint) = CreateResource();
        var token = TestTokens.Create("signing");
        handler.Enqueue(
            HttpStatusCode.OK,
            $$"""{"access_token": "{{token}}", "envelope": {{EnvelopeJson}}, "recipient": {{RecipientJson}}, "signatures": [], "initials": []}""");

        var response = await recipients.StartSigningSessionAsync("e-1", "Recipient 1", "key-abc", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Post, request.Method);
        Assert.Equal("/v2/sign/unauth/e-1/Recipient%201/key-abc", request.Uri!.PathAndQuery);
        Assert.Null(request.Body);

        Assert.Equal(token, response.AccessToken);
        Assert.Equal("Bill of Sale", response.Envelope.Name);
        Assert.Equal("Recipient 1", response.Recipient.RoleName);
        Assert.Empty(response.Signatures!);

        // The js-sdk stores the signing token on the endpoint; the port must do the same.
        Assert.Equal(token, endpoint.Token);
        Assert.Equal(SessionType.Signing, endpoint.SessionType);
    }

    [Fact]
    public async Task GetInPersonLinkAsync_PostsAndParsesLinkResponse()
    {
        var (recipients, handler, _) = CreateResource();
        handler.Enqueue(
            HttpStatusCode.OK,
            $$"""
            {
              "link": "https://app.verdocs.com/sign?key=abc",
              "access_token": "token-1",
              "access_key": {
                "id": "k-1",
                "type": "in_person_link",
                "envelope_id": "e-1",
                "key": "abc",
                "role_name": "Recipient 1",
                "created_at": "2026-07-01T12:00:00Z"
              },
              "envelope": {{EnvelopeJson}},
              "recipient": {{RecipientJson}}
            }
            """);

        var response = await recipients.GetInPersonLinkAsync("e-1", "Recipient 1", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Post, request.Method);
        Assert.Equal("/v2/sign/in-person/e-1/Recipient%201", request.Uri!.PathAndQuery);
        Assert.Equal("https://app.verdocs.com/sign?key=abc", response.Link);
        Assert.Equal("abc", response.AccessKey.Key);
        Assert.Equal("in_person_link", response.AccessKey.Type);
        Assert.Equal("Bill of Sale", response.Envelope.Name);
    }

    [Fact]
    public async Task VerifySignerAsync_KbaStep_PostsMixedAnswerTypes()
    {
        var (recipients, handler, _) = CreateResource();
        handler.Enqueue(
            HttpStatusCode.OK,
            $$"""{"access_token": "token-2", "envelope": {{EnvelopeJson}}, "recipient": {{RecipientJson}}}""");

        var response = await recipients.VerifySignerAsync(
            new AuthenticateRecipientRequest
            {
                AuthMethod = "kba",
                FirstName = "Paige",
                LastName = "Turner",
                Address = "123 Main St",
                Responses =
                [
                    new KbaResponse { Type = "prior-address", Answer = 2 },
                    new KbaResponse { Type = "prior-street", Answer = "Main St" },
                ],
            },
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Post, request.Method);
        Assert.Equal("/v2/sign/verify", request.Uri!.PathAndQuery);

        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        Assert.Equal("kba", (string?)body["auth_method"]);
        Assert.Equal("Paige", (string?)body["first_name"]);
        Assert.False(body.ContainsKey("code"));

        // Answers keep their runtime types: the js-sdk allows both numbers and strings.
        var responses = Assert.IsType<JsonArray>(body["responses"]);
        Assert.Equal(2, (int?)responses[0]!["answer"]);
        Assert.Equal("Main St", (string?)responses[1]!["answer"]);
        Assert.Equal("token-2", response.AccessToken);
    }

    [Fact]
    public async Task VerifySignerAsync_PasscodeStep_PostsCode()
    {
        var (recipients, handler, _) = CreateResource();
        handler.Enqueue(
            HttpStatusCode.OK,
            $$"""{"access_token": "token-3", "envelope": {{EnvelopeJson}}, "recipient": {{RecipientJson}}}""");

        await recipients.VerifySignerAsync(
            new AuthenticateRecipientRequest { AuthMethod = "passcode", Code = "1234" },
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        Assert.Equal("passcode", (string?)body["auth_method"]);
        Assert.Equal("1234", (string?)body["code"]);
        Assert.False(body.ContainsKey("resend"));
        Assert.False(body.ContainsKey("responses"));
    }

    [Fact]
    public async Task DelegateAsync_PostsDelegateRequest()
    {
        var (recipients, handler, _) = CreateResource();

        await recipients.DelegateAsync(
            "e-1",
            "Recipient 1",
            new DelegateRecipientRequest
            {
                FirstName = "Sub",
                LastName = "Stitute",
                Email = "sub@example.com",
                Message = "Please sign for me",
            },
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Post, request.Method);
        Assert.Equal("/v2/envelopes/e-1/recipients/Recipient%201/delegate", request.Uri!.PathAndQuery);

        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        Assert.Equal("Sub", (string?)body["first_name"]);
        Assert.Equal("Stitute", (string?)body["last_name"]);
        Assert.Equal("sub@example.com", (string?)body["email"]);
        Assert.Equal("Please sign for me", (string?)body["message"]);
        Assert.False(body.ContainsKey("phone"));
    }

    [Fact]
    public async Task UpdateAsync_PatchesOnlySetFields()
    {
        var (recipients, handler, _) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, RecipientJson);

        var recipient = await recipients.UpdateAsync(
            "e-1",
            "Recipient 1",
            new UpdateRecipientParams
            {
                Email = "new@example.com",
                SsnLast4 = "1234",
                NameLocked = true,
            },
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Patch, request.Method);
        Assert.Equal("/v2/envelopes/e-1/recipients/Recipient%201", request.Uri!.PathAndQuery);

        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        Assert.Equal("new@example.com", (string?)body["email"]);
        Assert.Equal("1234", (string?)body["ssn_last_4"]);
        // Sent as a real boolean even though the js-sdk types name_locked as a string.
        Assert.True((bool?)body["name_locked"]);
        Assert.False(body.ContainsKey("action"));
        Assert.False(body.ContainsKey("first_name"));
        Assert.Equal("Paige", recipient.FirstName);
    }

    [Fact]
    public async Task RemindAsync_PatchesRemindAction()
    {
        var (recipients, handler, _) = CreateResource();

        await recipients.RemindAsync("e-1", "Recipient 1", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Patch, request.Method);
        Assert.Equal("/v2/envelopes/e-1/recipients/Recipient%201", request.Uri!.PathAndQuery);
        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        Assert.Equal("remind", (string?)body["action"]);
    }

    [Fact]
    public async Task ResetAsync_PatchesResetAction()
    {
        var (recipients, handler, _) = CreateResource();

        await recipients.ResetAsync("e-1", "Recipient 1", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Patch, request.Method);
        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        Assert.Equal("reset", (string?)body["action"]);
    }

    [Fact]
    public async Task AskQuestionAsync_PostsQuestionBody()
    {
        var (recipients, handler, _) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, RecipientJson);

        await recipients.AskQuestionAsync("e-1", "Recipient 1", "What is this document?", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Post, request.Method);
        Assert.Equal("/v2/envelopes/e-1/recipients/Recipient%201/ask-question", request.Uri!.PathAndQuery);
        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        Assert.Equal("What is this document?", (string?)body["question"]);
    }

    [Fact]
    public void StartSigningSessionAsync_EmptyKey_ThrowsSynchronously()
    {
        var (recipients, _, _) = CreateResource();

        Assert.Throws<ArgumentException>(
            () => { _ = recipients.StartSigningSessionAsync("e-1", "Recipient 1", "", TestContext.Current.CancellationToken); });
    }

    [Fact]
    public void VerifySignerAsync_NullRequest_ThrowsSynchronously()
    {
        var (recipients, _, _) = CreateResource();

        Assert.Throws<ArgumentNullException>(
            () => { _ = recipients.VerifySignerAsync((AuthenticateRecipientRequest)null!, TestContext.Current.CancellationToken); });
    }

    private const string RetakeJson = """
        {
          "status": "ERROR",
          "code": "id_retake",
          "error": "Please retake the photos.",
          "images": [
            { "image": "face_image", "errors": ["Poor Quality Selfie"] },
            { "image": "back_image", "errors": ["Barcode Not Detected", "Document is Skewed"] }
          ]
        }
        """;

    private static IdImageUpload Image(string fileName, string body)
    {
        return new IdImageUpload
        {
            Content = new MemoryStream(Encoding.ASCII.GetBytes(body)),
            FileName = fileName,
            ContentType = "image/jpeg",
        };
    }

    [Fact]
    public async Task VerifySignerAsync_IdVerification_SendsMultipartParts()
    {
        var (recipients, handler, _) = CreateResource();
        handler.Enqueue(
            HttpStatusCode.OK,
            $$"""{"access_token": "token-4", "envelope": {{EnvelopeJson}}, "recipient": {{RecipientJson}}}""");

        var response = await recipients.VerifySignerAsync(
            new AuthenticateRecipientViaIdRequest
            {
                CountryCode = "USA",
                DocumentType = IdDocumentType.DriverLicense,
                FrontImage = Image("front.jpg", "FRONTDATA"),
                BackImage = Image("back.jpg", "BACKDATA"),
                FaceImage = Image("selfie.jpg", "SELFIEDATA"),
            },
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Post, request.Method);
        Assert.Equal("/v2/sign/verify", request.Uri!.PathAndQuery);

        var parts = ParseMultipart(request.Body!);
        Assert.Equal(["auth_method", "country_code", "document_type", "front_image", "back_image", "face_image"], parts.Keys);
        Assert.Equal("id", parts["auth_method"].Body);
        Assert.Equal("USA", parts["country_code"].Body);
        Assert.Equal("driverLicense", parts["document_type"].Body);
        Assert.Equal("FRONTDATA", parts["front_image"].Body);
        Assert.Equal("BACKDATA", parts["back_image"].Body);
        Assert.Equal("SELFIEDATA", parts["face_image"].Body);
        Assert.Contains("filename=\"front.jpg\"", parts["front_image"].Headers);
        Assert.Contains("filename=\"selfie.jpg\"", parts["face_image"].Headers);
        Assert.Contains("Content-Type: image/jpeg", parts["face_image"].Headers);
        Assert.Equal("token-4", response.AccessToken);
    }

    [Fact]
    public async Task VerifySignerAsync_IdVerificationWithoutBack_OmitsBackImagePart()
    {
        var (recipients, handler, _) = CreateResource();
        handler.Enqueue(
            HttpStatusCode.OK,
            $$"""{"access_token": "token-5", "envelope": {{EnvelopeJson}}, "recipient": {{RecipientJson}}}""");

        await recipients.VerifySignerAsync(
            new AuthenticateRecipientViaIdRequest
            {
                CountryCode = "GBR",
                DocumentType = IdDocumentType.Passport,
                FrontImage = Image("front.jpg", "FRONTDATA"),
                FaceImage = Image("selfie.jpg", "SELFIEDATA"),
            },
            TestContext.Current.CancellationToken);

        var parts = ParseMultipart(Assert.Single(handler.Requests).Body!);
        Assert.False(parts.ContainsKey("back_image"));
        Assert.Equal("passport", parts["document_type"].Body);
        Assert.Equal(["auth_method", "country_code", "document_type", "front_image", "face_image"], parts.Keys);
    }

    [Fact]
    public async Task VerifySignerAsync_IdVerification_OutlastsShortEndpointTimeout()
    {
        var handler = new FakeHttpMessageHandler();
        using var client = new HttpClient(handler);
        var endpoint = new VerdocsEndpoint(
            new VerdocsEndpointOptions { BaseUrl = TestBaseUrl, Timeout = TimeSpan.FromMilliseconds(50) },
            client);
        var recipients = new Recipients(endpoint);
        handler.Enqueue(async (_, cancellationToken) =>
        {
            await Task.Delay(TimeSpan.FromMilliseconds(300), cancellationToken);
            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(
                    $$"""{"access_token": "token-6", "envelope": {{EnvelopeJson}}, "recipient": {{RecipientJson}}}""",
                    Encoding.UTF8,
                    "application/json"),
            };
        });

        // The endpoint's 50ms would cut this off; the ID call gets its own, longer timeout.
        var response = await recipients.VerifySignerAsync(
            new AuthenticateRecipientViaIdRequest
            {
                CountryCode = "USA",
                DocumentType = IdDocumentType.IdCard,
                FrontImage = Image("front.jpg", "F"),
                FaceImage = Image("selfie.jpg", "S"),
            },
            TestContext.Current.CancellationToken);

        Assert.Equal("token-6", response.AccessToken);
    }

    [Fact]
    public async Task VerifySignerAsync_IdRetakeResponse_IsRecognizedByIsIdRetakeRequired()
    {
        var (recipients, handler, _) = CreateResource();
        handler.Enqueue(HttpStatusCode.BadRequest, RetakeJson);

        IdRetakeResponse? caught = null;
        try
        {
            await recipients.VerifySignerAsync(
                new AuthenticateRecipientViaIdRequest
                {
                    CountryCode = "USA",
                    DocumentType = IdDocumentType.Passport,
                    FrontImage = Image("front.jpg", "F"),
                    FaceImage = Image("selfie.jpg", "S"),
                },
                TestContext.Current.CancellationToken);
        }
        catch (VerdocsApiException e) when (Recipients.IsIdRetakeRequired(e, out var retake))
        {
            caught = retake;
        }

        Assert.NotNull(caught);
        Assert.Equal(IdImageField.FaceImage, caught.Images[0].Image);
    }

    [Fact]
    public void VerifySignerAsync_JsonRequestWithIdMethod_ThrowsSynchronously()
    {
        var (recipients, _, _) = CreateResource();

        Assert.Throws<ArgumentException>(
            () => { _ = recipients.VerifySignerAsync(new AuthenticateRecipientRequest { AuthMethod = RecipientAuthMethod.Id }, TestContext.Current.CancellationToken); });
    }

    [Fact]
    public void VerifySignerAsync_IdRequestWithBadContentType_ThrowsSynchronously()
    {
        var (recipients, _, _) = CreateResource();
        var request = new AuthenticateRecipientViaIdRequest
        {
            CountryCode = "USA",
            DocumentType = IdDocumentType.Passport,
            FrontImage = Image("front.jpg", "F") with { ContentType = "not a mime type" },
            FaceImage = Image("selfie.jpg", "S"),
        };

        Assert.Throws<ArgumentException>(
            () => { _ = recipients.VerifySignerAsync(request, TestContext.Current.CancellationToken); });
    }

    [Fact]
    public void IsIdRetakeRequired_RetakeBody_ReturnsTrueWithImages()
    {
        var exception = new VerdocsApiException(HttpStatusCode.BadRequest, RetakeJson);

        Assert.True(Recipients.IsIdRetakeRequired(exception, out var retake));
        Assert.Equal("ERROR", retake.Status);
        Assert.Equal("id_retake", retake.Code);
        Assert.Equal("Please retake the photos.", retake.Error);
        Assert.Equal(2, retake.Images.Count);
        Assert.Equal(IdImageField.FaceImage, retake.Images[0].Image);
        Assert.Equal([IdImageError.PoorQualitySelfie], retake.Images[0].Errors);
        Assert.Equal([IdImageError.BarcodeNotDetected, IdImageError.DocumentIsSkewed], retake.Images[1].Errors);
    }

    [Theory]
    [InlineData(HttpStatusCode.BadRequest, """{"status": "ERROR", "error": "Front image is required"}""")]
    [InlineData(HttpStatusCode.InternalServerError, """{"code": "id_retake", "images": []}""")]
    [InlineData(HttpStatusCode.BadRequest, """{"code": "id_retake", "images": "face_image"}""")]
    [InlineData(HttpStatusCode.BadRequest, """{"code": "id_retake", "images": [1, 2]}""")]
    [InlineData(HttpStatusCode.BadRequest, """["id_retake"]""")]
    [InlineData(HttpStatusCode.BadRequest, "<html>Bad Request</html>")]
    [InlineData(HttpStatusCode.BadRequest, "")]
    public void IsIdRetakeRequired_OtherErrors_ReturnsFalse(HttpStatusCode statusCode, string body)
    {
        var exception = new VerdocsApiException(statusCode, body);

        Assert.False(Recipients.IsIdRetakeRequired(exception, out var retake));
        Assert.Null(retake);
    }

    [Fact]
    public void IsIdRetakeRequired_NonApiException_ReturnsFalse()
    {
        Assert.False(Recipients.IsIdRetakeRequired(new HttpRequestException("Network Error"), out _));
        Assert.False(Recipients.IsIdRetakeRequired(null, out _));
    }

    [Fact]
    public void Recipient_IdVerificationFields_Deserialize()
    {
        const string json = """
            {
              "envelope_id": "e-1",
              "role_name": "Recipient 1",
              "status": "invited",
              "first_name": "Paige",
              "last_name": "Turner",
              "email": "paige@example.com",
              "type": "signer",
              "id_verification_level": "plus",
              "auth_methods": ["id"],
              "auth_method_states": { "id": "pending" },
              "created_at": "2026-07-01T12:00:00Z",
              "updated_at": "2026-07-01T12:00:00Z"
            }
            """;

        var recipient = JsonSerializer.Deserialize<Recipient>(json, VerdocsJson.Options)!;

        Assert.Equal(RecipientIdVerificationLevel.Plus, recipient.IdVerificationLevel);
        Assert.Equal("pending", recipient.AuthMethodStates![RecipientAuthMethod.Id]);
        Assert.Null(recipient.AdditionalData);
    }

    [Fact]
    public void CreateEnvelopeRecipient_IdVerificationLevel_SerializesSnakeCase()
    {
        var recipient = new CreateEnvelopeRecipient
        {
            RoleName = "Recipient 1",
            FirstName = "Paige",
            LastName = "Turner",
            AuthMethods = [RecipientAuthMethod.Id],
            IdVerificationLevel = RecipientIdVerificationLevel.Base,
        };

        var body = Assert.IsType<JsonObject>(JsonSerializer.SerializeToNode(recipient, VerdocsJson.Options));
        Assert.Equal("base", (string?)body["id_verification_level"]);

        var withoutLevel = Assert.IsType<JsonObject>(JsonSerializer.SerializeToNode(recipient with { IdVerificationLevel = null }, VerdocsJson.Options));
        Assert.False(withoutLevel.ContainsKey("id_verification_level"));
    }

    // Splits a captured multipart body into its parts, keyed by part name in wire order, so
    // tests can assert on exactly which parts went out.
    private static Dictionary<string, (string Headers, string Body)> ParseMultipart(string body)
    {
        var boundary = body[..body.IndexOf("\r\n", StringComparison.Ordinal)];
        var parts = new Dictionary<string, (string Headers, string Body)>();
        foreach (var chunk in body.Split(boundary).Skip(1))
        {
            if (chunk.StartsWith("--", StringComparison.Ordinal))
            {
                break;
            }

            var split = chunk.IndexOf("\r\n\r\n", StringComparison.Ordinal);
            var headers = chunk[..split];
            var content = chunk[(split + 4)..^2];
            var nameStart = headers.IndexOf("name=\"", StringComparison.Ordinal) + 6;
            var name = headers[nameStart..headers.IndexOf('"', nameStart)];
            parts.Add(name, (headers, content));
        }

        return parts;
    }
}
