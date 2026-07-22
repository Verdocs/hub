using System.Globalization;
using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json.Nodes;
using Verdocs.Models;
using Xunit;

namespace Verdocs.Sdk.Tests;

/// <summary>Request shapes and response handling for the Organizations resource.</summary>
public sealed class OrganizationsResourceTests
{
    private const string TestBaseUrl = "https://api.test";

    private const string OrganizationJson = """
        {
          "id": "org-1",
          "name": "Acme",
          "contact_email": "ops@acme.com",
          "full_logo_url": "https://cdn.test/org-logos/org-1",
          "deletion_protected": true,
          "created_at": "2026-01-01T00:00:00Z",
          "updated_at": "2026-06-01T00:00:00Z"
        }
        """;

    private const string ProfileJson = """
        {
          "id": "prof-1",
          "organization_id": "org-1",
          "first_name": "Test",
          "last_name": "Owner",
          "email": "owner@acme.com",
          "current": true,
          "permissions": [],
          "roles": ["owner"],
          "created_at": "2026-01-01T00:00:00Z",
          "updated_at": "2026-01-01T00:00:00Z"
        }
        """;

    private const string TokensJson = """
        {
          "access_token": "eyJ.access.fake",
          "id_token": "eyJ.id.fake",
          "refresh_token": "refresh-1",
          "expires_in": 86400,
          "access_token_exp": 1785000000,
          "refresh_token_exp": 1787592000
        }
        """;

    private static (Verdocs.Resources.Organizations Organizations, FakeHttpMessageHandler Handler, VerdocsEndpoint Endpoint) CreateResource()
    {
        var handler = new FakeHttpMessageHandler();
        var client = new HttpClient(handler);
        var endpoint = new VerdocsEndpoint(new VerdocsEndpointOptions { BaseUrl = TestBaseUrl }, client);
        return (new Verdocs.Resources.Organizations(endpoint), handler, endpoint);
    }

    [Fact]
    public async Task GetAsync_RequestsOrganizationById_ParsesOrganization()
    {
        var (organizations, handler, _) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, OrganizationJson);

        var organization = await organizations.GetAsync("org-1", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Get, request.Method);
        Assert.Equal("/v2/organizations/org-1", request.Uri!.PathAndQuery);
        Assert.Equal("Acme", organization.Name);
        Assert.True(organization.DeletionProtected);
    }

    [Fact]
    public void GetAsync_EmptyId_ThrowsSynchronously()
    {
        var (organizations, _, _) = CreateResource();

        Assert.Throws<ArgumentException>(
            () => { _ = organizations.GetAsync("", TestContext.Current.CancellationToken); });
    }

    [Fact]
    public async Task GetChildrenAsync_ParsesChildList()
    {
        var (organizations, handler, _) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, """
            [
              {"id": "org-child-1", "name": "Child One", "parent_id": "org-1", "deletion_protected": true,
               "created_at": "2026-02-01T00:00:00Z", "updated_at": "2026-02-01T00:00:00Z",
               "entitlements": [{"id": "ent-1", "organization_id": "org-child-1", "feature": "sms_auth",
                 "starts_at": "2026-01-01T00:00:00Z", "ends_at": "2027-01-01T00:00:00Z",
                 "monthly_max": 100, "yearly_max": 1200, "created_at": "2026-01-01T00:00:00Z"}]},
              {"id": "org-child-2", "name": "Child Two", "parent_id": "org-1", "deletion_protected": true,
               "created_at": "2026-03-01T00:00:00Z", "updated_at": "2026-03-01T00:00:00Z", "entitlements": []}
            ]
            """);

        var children = await organizations.GetChildrenAsync("org-1", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal("/v2/organizations/org-1/children", request.Uri!.PathAndQuery);
        Assert.Equal(2, children.Count);
        Assert.Equal("Child One", children[0].Name);
        var entitlement = Assert.Single(children[0].Entitlements!);
        Assert.Equal("sms_auth", entitlement.Feature);
    }

    [Fact]
    public async Task GetUsageAsync_NoOptions_RequestsBarePathAndParsesCounts()
    {
        var (organizations, handler, _) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, """
            {"org-1": {"envelope": 5, "template": 2}, "org-child-1": {"envelope": 1}}
            """);

        var usage = await organizations.GetUsageAsync("org-1", null, TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal("/v2/organizations/org-1/usage", request.Uri!.PathAndQuery);
        Assert.Equal(2, usage.Count);
        Assert.Equal(5, usage["org-1"][UsageType.Envelope]);
        Assert.Equal(1, usage["org-child-1"]["envelope"]);
    }

    [Fact]
    public async Task GetUsageAsync_AllOptions_BuildsUtcQuery()
    {
        var (organizations, handler, _) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, "{}");

        await organizations.GetUsageAsync(
            "org-1",
            new GetOrganizationUsageOptions
            {
                // The offset must be normalized to UTC; the server rejects offset-form dates.
                StartDate = new DateTimeOffset(2026, 6, 1, 0, 0, 0, TimeSpan.FromHours(-5)),
                EndDate = new DateTimeOffset(2026, 7, 1, 0, 0, 0, TimeSpan.Zero),
                UsageType = UsageType.Envelope,
            },
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(
            "/v2/organizations/org-1/usage"
            + "?start_date=2026-06-01T05%3A00%3A00.0000000Z"
            + "&end_date=2026-07-01T00%3A00%3A00.0000000Z"
            + "&usage_type=envelope",
            request.Uri!.PathAndQuery);
    }

    [Fact]
    public async Task CreateAsync_TopLevelOrganization_ParsesTokensAndProfile()
    {
        var (organizations, handler, _) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK,
            "{" + TokensJson.Trim()[1..^1] + ", \"organization\": " + OrganizationJson + ", \"profile\": " + ProfileJson + "}");

        var created = await organizations.CreateAsync(
            new CreateOrganizationRequest { Name = "Acme", ContactEmail = "ops@acme.com" },
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Post, request.Method);
        Assert.Equal("/v2/organizations", request.Uri!.PathAndQuery);
        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        Assert.Equal("Acme", (string?)body["name"]);
        Assert.Equal("ops@acme.com", (string?)body["contact_email"]);
        Assert.False(body.ContainsKey("parent_id"));

        Assert.Equal("eyJ.access.fake", created.AccessToken);
        Assert.Equal(86400, created.ExpiresIn);
        Assert.Equal("org-1", created.Organization?.Id);
        Assert.Equal("prof-1", created.Profile?.Id);
    }

    [Fact]
    public async Task CreateAsync_ChildOrganization_NormalizesOrganizationShape()
    {
        var (organizations, handler, _) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, """
            {
              "id": "org-child-1",
              "name": "Child Org",
              "parent_id": "org-1",
              "deletion_protected": true,
              "created_at": "2026-07-01T00:00:00Z",
              "updated_at": "2026-07-01T00:00:00Z",
              "api_key": {"client_id": "ck-child", "client_secret": "cs-child", "name": "Default"}
            }
            """);

        var created = await organizations.CreateAsync(
            new CreateOrganizationRequest { Name = "Child Org", ParentId = "org-1" },
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        Assert.Equal("org-1", (string?)body["parent_id"]);

        // No tokens are issued for child creations; the organization row is normalized into
        // the same response record, carrying the auto-created default API key.
        Assert.Null(created.AccessToken);
        Assert.Null(created.Profile);
        Assert.Equal("org-child-1", created.Organization?.Id);
        Assert.Equal("ck-child", created.Organization?.ApiKey?.ClientId);
        Assert.Equal("cs-child", created.Organization?.ApiKey?.ClientSecret);
    }

    [Fact]
    public void CreateAsync_NullRequest_ThrowsSynchronously()
    {
        var (organizations, _, _) = CreateResource();

        Assert.Throws<ArgumentNullException>(
            () => { _ = organizations.CreateAsync(null!, TestContext.Current.CancellationToken); });
    }

    [Fact]
    public async Task UpdateAsync_SendsOnlySetFields()
    {
        var (organizations, handler, _) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, OrganizationJson);

        var organization = await organizations.UpdateAsync(
            "org-1",
            new UpdateOrganizationRequest { Name = "Acme", Disclaimer = "<ol><li>Sign here</li></ol>", DeletionProtected = false },
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Patch, request.Method);
        Assert.Equal("/v2/organizations/org-1", request.Uri!.PathAndQuery);
        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        Assert.Equal(3, body.Count);
        Assert.Equal("Acme", (string?)body["name"]);
        Assert.Equal("<ol><li>Sign here</li></ol>", (string?)body["disclaimer"]);
        Assert.False((bool?)body["deletion_protected"]);
        Assert.Equal("org-1", organization.Id);
    }

    [Fact]
    public async Task GetPipelineSettingsAsync_RequestsPathAndParses()
    {
        var (organizations, handler, _) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, """
            {"process_acroforms": true, "process_tags": true, "ignore_invalid_roles": false, "ignore_invalid_fields": false}
            """);

        var settings = await organizations.GetPipelineSettingsAsync("org-1", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal("/v2/organizations/org-1/pipeline-settings", request.Uri!.PathAndQuery);
        Assert.True(settings.ProcessAcroforms);
        Assert.False(settings.IgnoreInvalidRoles);
    }

    [Fact]
    public async Task UpdatePipelineSettingsAsync_SendsOnlySetFlags()
    {
        var (organizations, handler, _) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, """
            {"process_acroforms": false, "process_tags": true, "ignore_invalid_roles": false, "ignore_invalid_fields": false}
            """);

        var settings = await organizations.UpdatePipelineSettingsAsync(
            "org-1",
            new UpdatePipelineSettingsRequest { ProcessTags = true },
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Patch, request.Method);
        Assert.Equal("/v2/organizations/org-1/pipeline-settings", request.Uri!.PathAndQuery);
        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        var flag = Assert.Single(body);
        Assert.Equal("process_tags", flag.Key);
        Assert.True(settings.ProcessTags);
    }

    [Fact]
    public async Task DeleteAsync_RemainingProfile_ParsesTokens()
    {
        var (organizations, handler, _) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, TokensJson);

        var tokens = await organizations.DeleteAsync("org-1", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Delete, request.Method);
        Assert.Equal("/v2/organizations/org-1", request.Uri!.PathAndQuery);
        Assert.NotNull(tokens);
        Assert.Equal("eyJ.access.fake", tokens.AccessToken);
    }

    [Fact]
    public async Task DeleteAsync_NoRemainingProfile_ReturnsNull()
    {
        var (organizations, handler, _) = CreateResource();
        // The server answers 204 with an empty body when the caller has no other profile.
        handler.Enqueue(HttpStatusCode.NoContent, "");

        var tokens = await organizations.DeleteAsync("org-1", TestContext.Current.CancellationToken);

        Assert.Null(tokens);
    }

    [Fact]
    public async Task UpdateLogoAsync_SendsMultipartLogoPart()
    {
        var (organizations, handler, _) = CreateResource();
        string? contentTypeHeader = null;
        handler.Enqueue((request, _) =>
        {
            contentTypeHeader = request.Content?.Headers.ContentType?.ToString();
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(OrganizationJson, Encoding.UTF8, "application/json"),
            });
        });

        using var file = new MemoryStream(Encoding.ASCII.GetBytes("fake-png-logo"));
        var organization = await organizations.UpdateLogoAsync(
            "org-1", file, "logo.png", "image/png", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Patch, request.Method);
        Assert.Equal("/v2/organizations/org-1", request.Uri!.PathAndQuery);
        Assert.NotNull(contentTypeHeader);
        Assert.Equal("multipart/form-data", MediaTypeHeaderValue.Parse(contentTypeHeader).MediaType);

        // The server keys off the part name: "logo" updates full_logo_url.
        Assert.Contains("name=\"logo\"", request.Body);
        Assert.Contains("filename=\"logo.png\"", request.Body);
        Assert.Contains("Content-Type: image/png", request.Body);
        Assert.Contains("fake-png-logo", request.Body);
        Assert.DoesNotContain("name=\"thumbnail\"", request.Body);
        Assert.Equal("org-1", organization.Id);
    }

    [Fact]
    public async Task UpdateThumbnailAsync_SendsMultipartThumbnailPart()
    {
        var (organizations, handler, _) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, OrganizationJson);

        using var file = new MemoryStream(Encoding.ASCII.GetBytes("fake-png-thumb"));
        await organizations.UpdateThumbnailAsync(
            "org-1", file, "thumb.png", "image/png", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Patch, request.Method);
        Assert.Equal("/v2/organizations/org-1", request.Uri!.PathAndQuery);
        Assert.Contains("name=\"thumbnail\"", request.Body);
        Assert.Contains("filename=\"thumb.png\"", request.Body);
        Assert.Contains("fake-png-thumb", request.Body);
        Assert.DoesNotContain("name=\"logo\"", request.Body);
    }

    [Fact]
    public async Task GetEntitlementsAsync_RequestsPathAndParses()
    {
        var (organizations, handler, _) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, """
            [{"id": "ent-1", "organization_id": "org-1", "feature": "kba_auth",
              "starts_at": "2026-01-01T00:00:00Z", "ends_at": "2027-01-01T00:00:00Z",
              "monthly_max": 100, "yearly_max": 1200, "created_at": "2026-01-01T00:00:00Z"}]
            """);

        var entitlements = await organizations.GetEntitlementsAsync(TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal("/v2/organizations/entitlements", request.Uri!.PathAndQuery);
        var entitlement = Assert.Single(entitlements);
        Assert.Equal("kba_auth", entitlement.Feature);
        Assert.Equal(100, entitlement.MonthlyMax);
    }

    [Fact]
    public void GetActiveEntitlementsAsync_NoSession_ThrowsSynchronously()
    {
        var (organizations, _, _) = CreateResource();

        Assert.Throws<InvalidOperationException>(
            () => { _ = organizations.GetActiveEntitlementsAsync(TestContext.Current.CancellationToken); });
    }

    [Fact]
    public async Task GetActiveEntitlementsAsync_CollapsesToCurrentGrants()
    {
        var (organizations, handler, endpoint) = CreateResource();
        endpoint.SetToken(TestTokens.Create());

        var now = DateTimeOffset.UtcNow;
        static string Iso(DateTimeOffset value) => value.UtcDateTime.ToString("o", CultureInfo.InvariantCulture);
        handler.Enqueue(HttpStatusCode.OK, $$"""
            [
              {"id": "ent-expired", "organization_id": "org-1", "feature": "sms_auth",
               "starts_at": "{{Iso(now.AddDays(-10))}}", "ends_at": "{{Iso(now.AddDays(-5))}}",
               "monthly_max": 0, "yearly_max": 0, "created_at": "{{Iso(now.AddDays(-10))}}"},
              {"id": "ent-active", "organization_id": "org-1", "feature": "kba_auth",
               "starts_at": "{{Iso(now.AddDays(-1))}}", "ends_at": "{{Iso(now.AddDays(1))}}",
               "monthly_max": 100, "yearly_max": 1200, "created_at": "{{Iso(now.AddDays(-1))}}"},
              {"id": "ent-duplicate", "organization_id": "org-1", "feature": "kba_auth",
               "starts_at": "{{Iso(now.AddDays(-2))}}", "ends_at": "{{Iso(now.AddDays(2))}}",
               "monthly_max": 999, "yearly_max": 9999, "created_at": "{{Iso(now.AddDays(-2))}}"},
              {"id": "ent-future", "organization_id": "org-1", "feature": "doc_ai",
               "starts_at": "{{Iso(now.AddDays(5))}}", "ends_at": "{{Iso(now.AddDays(10))}}",
               "monthly_max": 10, "yearly_max": 100, "created_at": "{{Iso(now)}}"}
            ]
            """);

        var active = await organizations.GetActiveEntitlementsAsync(TestContext.Current.CancellationToken);

        // Expired and not-yet-started grants drop out, and the first active grant per
        // feature wins, mirroring the js-sdk collapse.
        var entry = Assert.Single(active);
        Assert.Equal("kba_auth", entry.Key);
        Assert.Equal("ent-active", entry.Value.Id);
    }
}
