using System.Net;
using System.Text.Json.Nodes;
using Verdocs.Models;
using Verdocs.Resources;
using Xunit;

namespace Verdocs.Sdk.Tests;

/// <summary>
/// Request shapes and response handling for the Kba resource. These routes do not exist in the
/// deployed API (real KBA runs through Recipients.VerifySignerAsync); the stubs are ported
/// code-faithfully from the js-sdk, so the tests pin the exact wire shapes the js-sdk emits.
/// </summary>
public sealed class KbaTests
{
    private const string TestBaseUrl = "https://api.test";

    private const string ChallengeStepJson = """
        {
          "envelope_id": "e-1",
          "role_name": "Recipient 1",
          "kba_step": "challenge",
          "questions": [
            {
              "type": "prior-address",
              "message": "Which of these addresses have you lived at?",
              "options": ["123 Main St", 42]
            }
          ]
        }
        """;

    private static (Kba Kba, FakeHttpMessageHandler Handler) CreateResource()
    {
        var handler = new FakeHttpMessageHandler();
        var client = new HttpClient(handler);
        var endpoint = new VerdocsEndpoint(new VerdocsEndpointOptions { BaseUrl = TestBaseUrl }, client);
        return (new Kba(endpoint), handler);
    }

    [Fact]
    public async Task GetStepAsync_RequestsKbaPath_ParsesChallengeStep()
    {
        var (kba, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, ChallengeStepJson);

        var step = await kba.GetStepAsync("e-1", "Recipient 1", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Get, request.Method);
        Assert.Equal("/v2/kba/e-1/Recipient%201", request.Uri!.PathAndQuery);

        Assert.Equal("challenge", step.KbaStep);
        Assert.Equal("e-1", step.EnvelopeId);
        var question = Assert.Single(step.Questions!);
        Assert.Equal("prior-address", question.Type);
        // Options mix strings and numbers in the js-sdk type, so they stay raw JSON.
        Assert.Equal("123 Main St", question.Options[0].GetString());
        Assert.Equal(42, question.Options[1].GetInt32());
        Assert.Null(step.Message);
    }

    [Fact]
    public async Task SubmitPinAsync_PostsSnakeCaseBody()
    {
        var (kba, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, """{"envelope_id": "e-1", "role_name": "Recipient 1", "kba_step": "identity"}""");

        var step = await kba.SubmitPinAsync("e-1", "Recipient 1", "9876", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Post, request.Method);
        Assert.Equal("/v2/kba/pin", request.Uri!.PathAndQuery);

        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        Assert.Equal("e-1", (string?)body["envelope_id"]);
        Assert.Equal("Recipient 1", (string?)body["role_name"]);
        Assert.Equal("9876", (string?)body["pin"]);
        Assert.Equal("identity", step.KbaStep);
    }

    [Fact]
    public async Task SubmitIdentityAsync_PostsCamelCaseIdentityKeys()
    {
        var (kba, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, """{"envelope_id": "e-1", "role_name": "Recipient 1", "kba_step": "complete"}""");

        await kba.SubmitIdentityAsync(
            "e-1",
            "Recipient 1",
            new KbaIdentity
            {
                FirstName = "Paige",
                LastName = "Turner",
                Address = "123 Main St",
                SsnLast4 = "1234",
            },
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal("/v2/kba/identity", request.Uri!.PathAndQuery);

        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        Assert.Equal("e-1", (string?)body["envelope_id"]);
        Assert.Equal("Recipient 1", (string?)body["role_name"]);

        // The identity payload is camelCase on the wire, unlike the rest of the API; the
        // js-sdk shape is the only contract for this never-deployed route, so we match it.
        var identity = Assert.IsType<JsonObject>(body["identity"]);
        Assert.Equal("Paige", (string?)identity["firstName"]);
        Assert.Equal("Turner", (string?)identity["lastName"]);
        Assert.Equal("123 Main St", (string?)identity["address"]);
        Assert.Equal("1234", (string?)identity["ssnLast4"]);
        Assert.False(identity.ContainsKey("first_name"));
        Assert.False(identity.ContainsKey("city"));
    }

    [Fact]
    public async Task SubmitChallengeResponseAsync_PostsResponsesInOrder()
    {
        var (kba, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, """{"envelope_id": "e-1", "role_name": "Recipient 1", "kba_step": "failed", "message": "Verification failed"}""");

        var step = await kba.SubmitChallengeResponseAsync(
            "e-1",
            "Recipient 1",
            [
                new KbaResponse { Type = "prior-address", Answer = "123 Main St" },
                new KbaResponse { Type = "prior-county", Answer = 3 },
            ],
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal("/v2/kba/response", request.Uri!.PathAndQuery);

        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        Assert.Equal("e-1", (string?)body["envelope_id"]);
        var responses = Assert.IsType<JsonArray>(body["responses"]);
        Assert.Equal("prior-address", (string?)responses[0]!["type"]);
        Assert.Equal("123 Main St", (string?)responses[0]!["answer"]);
        Assert.Equal(3, (int?)responses[1]!["answer"]);

        Assert.Equal("failed", step.KbaStep);
        Assert.Equal("Verification failed", step.Message);
    }

    [Fact]
    public void SubmitPinAsync_EmptyPin_ThrowsSynchronously()
    {
        var (kba, _) = CreateResource();

        Assert.Throws<ArgumentException>(
            () => { _ = kba.SubmitPinAsync("e-1", "Recipient 1", "", TestContext.Current.CancellationToken); });
    }
}
