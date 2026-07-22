using System.Net;
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
            () => { _ = recipients.VerifySignerAsync(null!, TestContext.Current.CancellationToken); });
    }
}
