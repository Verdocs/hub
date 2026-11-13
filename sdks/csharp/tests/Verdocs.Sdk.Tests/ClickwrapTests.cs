using System.Net;
using System.Text.Json.Nodes;
using Verdocs.Models;
using Xunit;

namespace Verdocs.Sdk.Tests;

/// <summary>Request shapes and response handling for the Clickwrap resource.</summary>
public sealed class ClickwrapTests
{
    private const string TestBaseUrl = "https://api.test";
    private const string SessionToken = "vd_cw_abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG";
    private const string Now = "2026-11-12T15:00:00.000Z";

    private const string AgreementJson = """
        {"id": "a-1", "organization_id": "org-1", "key": "terms-of-service", "name": "Terms of Service",
         "created_by": "profile-1", "created_at": "2026-11-12T15:00:00.000Z", "updated_at": "2026-11-12T15:00:00.000Z"}
        """;

    private const string VersionJson = """
        {"id": "v-1", "agreement_id": "a-1", "number": 1, "status": "draft", "content": "<p>Be nice.</p>",
         "content_hash": null, "requires_reacceptance": false, "change_summary": null, "published_at": null,
         "published_by": null, "created_at": "2026-11-12T15:00:00.000Z", "updated_at": "2026-11-12T15:00:00.000Z"}
        """;

    private const string OutcomeJson = """{"acceptance_id": "r-1", "outcome": "accepted", "created_at": "2026-11-12T15:00:00.000Z"}""";

    private static readonly ClickwrapSessionOutcomeRequest SessionOutcome = new()
    {
        Surface = ClickwrapSurface.Component,
        Labels = new ClickwrapLabels
        {
            Agreements = [new ClickwrapAgreementLabel { VersionId = "v-1", Label = "I agree" }],
            Button = "Continue",
        },
        Presentation = "<p>Be nice.</p>",
    };

    private static (VerdocsEndpoint Endpoint, FakeHttpMessageHandler Handler) CreateEndpoint()
    {
        var handler = new FakeHttpMessageHandler();
        var endpoint = new VerdocsEndpoint(new VerdocsEndpointOptions { BaseUrl = TestBaseUrl }, new HttpClient(handler));
        return (endpoint, handler);
    }

    private static JsonObject BodyOf(CapturedRequest request) => Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));

    [Fact]
    public async Task ListAgreementsAsync_UnwrapsAgreements()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.OK, """
            {"agreements": [{"id": "a-1", "organization_id": "org-1", "key": "tos", "name": "Terms",
              "created_at": "2026-11-12T15:00:00.000Z", "updated_at": "2026-11-12T15:00:00.000Z",
              "current_version": {"id": "v-1", "number": 1, "status": "published", "published_at": "2026-11-12T15:00:00.000Z"},
              "draft_version": null}]}
            """);

        var agreements = await endpoint.Clickwrap.ListAgreementsAsync(TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal("/v2/clickwraps/agreements", request.Uri!.PathAndQuery);
        var agreement = Assert.Single(agreements);
        Assert.Equal(1, agreement.CurrentVersion!.Number);
        Assert.Null(agreement.DraftVersion);
    }

    [Fact]
    public async Task AgreementCalls_SendExpectedRequests_UnwrapResponses()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.OK, "{\"agreement\": " + AgreementJson.Replace("}", ", \"versions\": [" + VersionJson + "]}", StringComparison.Ordinal) + "}");
        handler.Enqueue(HttpStatusCode.Created, "{\"agreement\": " + AgreementJson + "}");
        handler.Enqueue(HttpStatusCode.OK, "{\"agreement\": " + AgreementJson.Replace("Terms of Service", "Terms of Use", StringComparison.Ordinal) + "}");
        var ct = TestContext.Current.CancellationToken;

        var detail = await endpoint.Clickwrap.GetAgreementAsync("a-1", ct);
        await endpoint.Clickwrap.CreateAgreementAsync(new CreateClickwrapAgreementRequest { Key = "terms-of-service", Name = "Terms of Service" }, ct);
        var renamed = await endpoint.Clickwrap.RenameAgreementAsync("a-1", "Terms of Use", ct);

        Assert.Equal("<p>Be nice.</p>", Assert.Single(detail.Versions).Content);
        Assert.Equal(HttpMethod.Post, handler.Requests[1].Method);
        Assert.Equal("terms-of-service", (string?)BodyOf(handler.Requests[1])["key"]);
        Assert.Equal(HttpMethod.Patch, handler.Requests[2].Method);
        Assert.Equal("/v2/clickwraps/agreements/a-1", handler.Requests[2].Uri!.PathAndQuery);
        Assert.Equal("Terms of Use", (string?)BodyOf(handler.Requests[2])["name"]);
        Assert.Equal("Terms of Use", renamed.Name);
    }

    [Fact]
    public async Task DraftCalls_SendOnlySetFields()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.Created, "{\"version\": " + VersionJson + "}");
        handler.Enqueue(HttpStatusCode.Created, "{\"version\": " + VersionJson + "}");
        handler.Enqueue(HttpStatusCode.OK, "{\"version\": " + VersionJson + "}");
        handler.Enqueue(HttpStatusCode.OK, "{\"version\": " + VersionJson.Replace("\"draft\"", "\"published\"", StringComparison.Ordinal) + "}");
        handler.Enqueue(HttpStatusCode.NoContent, "");
        var ct = TestContext.Current.CancellationToken;

        await endpoint.Clickwrap.CreateDraftAsync("a-1", new CreateClickwrapDraftRequest { CopyCurrent = true }, ct);
        await endpoint.Clickwrap.CreateDraftAsync("a-1", cancellationToken: ct);
        await endpoint.Clickwrap.UpdateDraftAsync("v-1", "<p>Be nice.</p>", ct);
        var published = await endpoint.Clickwrap.PublishVersionAsync("v-1", new PublishClickwrapVersionRequest { RequiresReacceptance = true }, ct);
        await endpoint.Clickwrap.DeleteDraftAsync("v-2", ct);

        Assert.Equal("/v2/clickwraps/agreements/a-1/versions", handler.Requests[0].Uri!.PathAndQuery);
        Assert.Equal("""{"copy_current":true}""", handler.Requests[0].Body);
        Assert.Equal("{}", handler.Requests[1].Body);
        Assert.Equal("<p>Be nice.</p>", (string?)BodyOf(handler.Requests[2])["content"]);
        Assert.Equal("""{"requires_reacceptance":true}""", handler.Requests[3].Body);
        Assert.Equal(ClickwrapVersionStatus.Published, published.Status);
        Assert.Equal(HttpMethod.Delete, handler.Requests[4].Method);
        Assert.Equal("/v2/clickwraps/versions/v-2", handler.Requests[4].Uri!.PathAndQuery);
    }

    [Fact]
    public async Task GetCoverageAsync_ParsesCounts()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.OK, """
            {"agreement_id": "a-1", "cutoff_number": 2, "accepted_any": 10, "current": 7,
             "versions": [{"id": "v-2", "number": 2, "published_at": "2026-11-12T15:00:00.000Z", "requires_reacceptance": true, "people": 7}]}
            """);

        var coverage = await endpoint.Clickwrap.GetCoverageAsync("a-1", TestContext.Current.CancellationToken);

        Assert.Equal("/v2/clickwraps/agreements/a-1/coverage", Assert.Single(handler.Requests).Uri!.PathAndQuery);
        Assert.Equal((10, 7, 7), (coverage.AcceptedAny, coverage.Current, Assert.Single(coverage.Versions).People));
    }

    [Fact]
    public async Task GetStatusAsync_JoinsKeysIntoOneQueryValue()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.OK, """
            [{"key": "tos", "current": true, "pending_version": null},
             {"key": "privacy", "current": false, "pending_version": {"id": "v-9", "number": 2, "requires_reacceptance": true}}]
            """);

        var status = await endpoint.Clickwrap.GetStatusAsync("user 1", ["tos", "privacy"], TestContext.Current.CancellationToken);

        Assert.Equal("/v2/clickwraps/status?user_id=user%201&agreements=tos%2Cprivacy", Assert.Single(handler.Requests).Uri!.PathAndQuery);
        Assert.True(status[0].Current);
        Assert.Equal(2, status[1].PendingVersion!.Number);
    }

    [Fact]
    public async Task CreateSessionAsync_AlreadyCurrent_ReturnsCurrentResult()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.OK, """{"current": true, "agreements": [{"key": "tos", "current": true, "pending_version": null}]}""");

        var result = await endpoint.Clickwrap.CreateSessionAsync(
            new CreateClickwrapSessionRequest { UserId = "user-1", Agreements = ["tos"], Mode = ClickwrapMode.Inline },
            TestContext.Current.CancellationToken);

        var current = Assert.IsType<ClickwrapSessionCurrent>(result);
        Assert.True(current.Current);
        Assert.True(Assert.Single(current.Agreements).Current);
        Assert.Equal("""{"user_id":"user-1","agreements":["tos"],"mode":"inline"}""", Assert.Single(handler.Requests).Body);
    }

    [Fact]
    public async Task CreateSessionAsync_SomethingToAccept_ReturnsCreatedResultWithToken()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.Created, $$"""
            {"current": false, "id": "s-1", "token": "{{SessionToken}}", "expires_at": "{{Now}}", "agreements": ["tos"],
             "hosted_url": "https://app.verdocs.com/accept#{{SessionToken}}", "status": [{"key": "tos", "current": false, "pending_version": null}]}
            """);

        var result = await endpoint.Clickwrap.CreateSessionAsync(
            new CreateClickwrapSessionRequest { UserId = "user-1", Agreements = ["tos"] }, TestContext.Current.CancellationToken);

        var created = Assert.IsType<ClickwrapSessionCreated>(result);
        Assert.False(created.Current);
        Assert.Equal(SessionToken, created.Token);
        Assert.Equal("tos", Assert.Single(created.Agreements));
    }

    [Fact]
    public async Task RecordOutcomeAsync_SendsOnlySetFields()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.Created, OutcomeJson);

        var result = await endpoint.Clickwrap.RecordOutcomeAsync(
            new RecordClickwrapOutcomeRequest
            {
                UserId = "user-1",
                Outcome = ClickwrapOutcome.Accepted,
                Agreements = [new ClickwrapOutcomeAgreement { Key = "tos", VersionId = "v-1" }],
                IpAddress = "203.0.113.7",
            },
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal("/v2/clickwraps/acceptances", request.Uri!.PathAndQuery);
        Assert.Equal(
            """{"user_id":"user-1","outcome":"accepted","agreements":[{"key":"tos","version_id":"v-1"}],"ip_address":"203.0.113.7"}""",
            request.Body);
        Assert.Equal("r-1", result.AcceptanceId);
    }

    [Fact]
    public async Task ListAndGetAcceptances_BuildQueryAndParseRecord()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.OK, """
            {"count": 1, "rows": 10, "page": 0, "acceptances": [{"id": "r-1", "outcome": "accepted", "user_id": "user-1",
              "metadata": null, "surface": "headless", "reported_by": "customer", "created_at": "2026-11-12T15:00:00.000Z",
              "agreements": [{"key": "tos", "version_id": "v-1", "number": 1}]}]}
            """);
        handler.Enqueue(HttpStatusCode.OK, """
            {"id": "r-1", "organization_id": "org-1", "session_id": null, "user_id": "user-1", "metadata": {"email": "pat@example.com"},
             "outcome": "accepted", "surface": "headless", "mode": null, "require_scroll": null, "ip_address": "203.0.113.7",
             "user_agent": null, "locale": null, "timezone": null, "viewport": null, "labels": null, "scroll_depth": null,
             "scrolled_to_end": null, "time_on_terms_ms": null, "presentation_hash": null, "presentation_source": "none",
             "has_presentation": false, "reported_by": "customer", "sequence": 3, "prev_hash": null, "record_hash": "abc",
             "created_at": "2026-11-12T15:00:00.000Z",
             "items": [{"content_hash": "def", "agreement_version": {"id": "v-1", "number": 1, "published_at": "2026-11-12T15:00:00.000Z",
               "agreement": {"key": "tos", "name": "Terms"}}}],
             "events": [{"event": "accepted", "agreement_id": null, "client_at": null, "created_at": "2026-11-12T15:00:00.000Z"}]}
            """);
        var ct = TestContext.Current.CancellationToken;

        var page = await endpoint.Clickwrap.ListAcceptancesAsync(
            new ListClickwrapAcceptancesOptions { MetadataKey = "email", MetadataValue = "pat@example.com", Rows = 10 }, ct);
        var record = await endpoint.Clickwrap.GetAcceptanceAsync("r-1", ct);

        Assert.Equal("/v2/clickwraps/acceptances?metadata_key=email&metadata_value=pat%40example.com&rows=10", handler.Requests[0].Uri!.PathAndQuery);
        Assert.Equal(1, Assert.Single(Assert.Single(page.Acceptances).Agreements).Number);
        Assert.Equal("pat@example.com", record.Metadata!["email"]);
        Assert.Equal("tos", Assert.Single(record.Items).AgreementVersion.Agreement.Key);
        Assert.Equal(ClickwrapEventType.Accepted, Assert.Single(record.Events).Event);
        Assert.Null(record.PrevHash);
    }

    [Fact]
    public async Task GetDownloadLinkAsync_PassesTypeAsQuery()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.OK, """{"type": "evidence", "url": "https://s3.test/evidence.zip", "expires_in": 900}""");

        var link = await endpoint.Clickwrap.GetDownloadLinkAsync("r-1", ClickwrapDownloadType.Evidence, TestContext.Current.CancellationToken);

        Assert.Equal("/v2/clickwraps/acceptances/r-1/download?type=evidence", Assert.Single(handler.Requests).Uri!.PathAndQuery);
        Assert.Equal(900, link.ExpiresIn);
    }

    [Fact]
    public async Task SessionCalls_SendTheSessionToken()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.OK, """
            {"id": "s-1", "expires_at": "2026-11-12T15:00:00.000Z", "mode": "modal", "require_scroll": false,
             "agreements": [{"key": "tos", "name": "Terms", "version_id": "v-1", "number": 1, "content": "<p>x</p>"}], "brand": null}
            """);
        handler.Enqueue(HttpStatusCode.NoContent, "");
        handler.Enqueue(HttpStatusCode.Created, OutcomeJson);
        handler.Enqueue(HttpStatusCode.Created, OutcomeJson.Replace("accepted", "declined", StringComparison.Ordinal));
        var ct = TestContext.Current.CancellationToken;

        var session = await endpoint.Clickwrap.GetSessionAsync(SessionToken, ct);
        await endpoint.Clickwrap.SendEventAsync(SessionToken, new SendClickwrapEventRequest { Event = ClickwrapEventType.Checked, VersionId = "v-1" }, ct);
        await endpoint.Clickwrap.AcceptAsync(SessionToken, SessionOutcome, ct);
        var declined = await endpoint.Clickwrap.DeclineAsync(SessionToken, SessionOutcome, ct);

        Assert.All(handler.Requests, request => Assert.Equal("Bearer " + SessionToken, request.Headers["Authorization"]));
        Assert.Equal(
            ["/v2/clickwraps/session", "/v2/clickwraps/session/events", "/v2/clickwraps/session/accept", "/v2/clickwraps/session/decline"],
            handler.Requests.Select(request => request.Uri!.PathAndQuery));
        Assert.Equal("v-1", Assert.Single(session.Agreements).VersionId);
        Assert.Equal("""{"event":"checked","version_id":"v-1"}""", handler.Requests[1].Body);
        Assert.Equal("component", (string?)BodyOf(handler.Requests[2])["surface"]);
        Assert.Equal(ClickwrapOutcome.Declined, declined.Outcome);
    }

    [Fact]
    public async Task SessionToken_DoesNotReplaceTheEndpointSession()
    {
        var (endpoint, handler) = CreateEndpoint();
        var userToken = TestTokens.Create();
        endpoint.SetToken(userToken);
        handler.Enqueue(HttpStatusCode.OK, """{"id": "s-1", "expires_at": "2026-11-12T15:00:00.000Z", "mode": "modal", "require_scroll": false, "agreements": []}""");
        handler.Enqueue(HttpStatusCode.OK, """{"agreements": []}""");
        var ct = TestContext.Current.CancellationToken;

        await endpoint.Clickwrap.GetSessionAsync(SessionToken, ct);
        await endpoint.Clickwrap.ListAgreementsAsync(ct);

        Assert.Equal(userToken, endpoint.Token);
        Assert.Equal("Bearer " + SessionToken, handler.Requests[0].Headers["Authorization"]);
        Assert.Equal("Bearer " + userToken, handler.Requests[1].Headers["Authorization"]);
    }

    [Fact]
    public async Task GetSessionAsync_RejectedToken_ThrowsApiException()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.Unauthorized, """{"error": "invalid session"}""");

        var exception = await Assert.ThrowsAsync<VerdocsApiException>(
            () => endpoint.Clickwrap.GetSessionAsync(SessionToken, TestContext.Current.CancellationToken));

        Assert.Equal(HttpStatusCode.Unauthorized, exception.StatusCode);
    }

    [Fact]
    public void Calls_MissingArguments_ThrowSynchronously()
    {
        var (endpoint, _) = CreateEndpoint();

        Assert.Throws<ArgumentException>(() => { _ = endpoint.Clickwrap.GetSessionAsync(""); });
        Assert.Throws<ArgumentNullException>(() => { _ = endpoint.Clickwrap.RecordOutcomeAsync(null!); });
    }
}
