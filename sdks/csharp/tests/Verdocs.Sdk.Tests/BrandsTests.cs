using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json.Nodes;
using Verdocs.Models;
using Xunit;

namespace Verdocs.Sdk.Tests;

/// <summary>Request shapes and response handling for the Brands resource.</summary>
public sealed class BrandsTests
{
    private const string TestBaseUrl = "https://api.test";

    private const string BrandJson = """
        {
          "id": "brand-1",
          "organization_id": "org-1",
          "key": "acme",
          "name": "Acme",
          "primary_color": "#FF0000",
          "email_domain": "notify.acme.com",
          "email_local_part": "notifications",
          "email_domain_status": "pending",
          "email_spf_verified": false,
          "email_dkim_verified": false,
          "email_dmarc_verified": false,
          "email_dkim_tokens": ["dkim-1", "dkim-2"],
          "email_reply_to_verified": false,
          "created_at": "2026-01-01T00:00:00Z",
          "updated_at": "2026-06-01T00:00:00Z"
        }
        """;

    private static (Verdocs.Resources.Brands Brands, FakeHttpMessageHandler Handler) CreateResource()
    {
        var handler = new FakeHttpMessageHandler();
        var client = new HttpClient(handler);
        var endpoint = new VerdocsEndpoint(new VerdocsEndpointOptions { BaseUrl = TestBaseUrl }, client);
        return (new Verdocs.Resources.Brands(endpoint), handler);
    }

    [Fact]
    public async Task ListAsync_RequestsBrandsPath_ParsesBrands()
    {
        var (brands, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, "[" + BrandJson + "]");

        var list = await brands.ListAsync("org-1", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Get, request.Method);
        Assert.Equal("/v2/organizations/org-1/brands", request.Uri!.PathAndQuery);
        var brand = Assert.Single(list);
        Assert.Equal("acme", brand.Key);
        Assert.Equal(2, brand.EmailDkimTokens.Count);
    }

    [Fact]
    public async Task CreateAsync_PostsKeyAndSetFieldsOnly()
    {
        var (brands, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, BrandJson);

        var brand = await brands.CreateAsync(
            "org-1",
            new CreateBrandRequest { Key = "acme", Name = "Acme", PrimaryColor = "#FF0000" },
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Post, request.Method);
        Assert.Equal("/v2/organizations/org-1/brands", request.Uri!.PathAndQuery);
        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        Assert.Equal(3, body.Count);
        Assert.Equal("acme", (string?)body["key"]);
        Assert.Equal("#FF0000", (string?)body["primary_color"]);
        Assert.Equal("brand-1", brand.Id);
    }

    [Fact]
    public void CreateAsync_NullRequest_ThrowsSynchronously()
    {
        var (brands, _) = CreateResource();

        Assert.Throws<ArgumentNullException>(
            () => { _ = brands.CreateAsync("org-1", null!, TestContext.Current.CancellationToken); });
    }

    [Fact]
    public async Task GetAsync_RequestsBrandPath_ParsesBrand()
    {
        var (brands, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, BrandJson);

        var brand = await brands.GetAsync("org-1", "brand-1", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal("/v2/organizations/org-1/brands/brand-1", request.Uri!.PathAndQuery);
        Assert.Equal("Acme", brand.Name);
    }

    [Fact]
    public void GetAsync_EmptyBrandId_ThrowsSynchronously()
    {
        var (brands, _) = CreateResource();

        Assert.Throws<ArgumentException>(
            () => { _ = brands.GetAsync("org-1", "", TestContext.Current.CancellationToken); });
    }

    [Fact]
    public async Task UpdateAsync_PatchesSetFieldsOnly()
    {
        var (brands, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, BrandJson);

        await brands.UpdateAsync(
            "org-1",
            "brand-1",
            new UpdateBrandRequest { PageTitle = "Acme Signing", Timezone = "America/Chicago" },
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Patch, request.Method);
        Assert.Equal("/v2/organizations/org-1/brands/brand-1", request.Uri!.PathAndQuery);
        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        Assert.Equal(2, body.Count);
        Assert.Equal("Acme Signing", (string?)body["page_title"]);
        Assert.Equal("America/Chicago", (string?)body["timezone"]);
    }

    [Fact]
    public async Task UpdateLogoAsync_SendsMultipartLogoPart()
    {
        var (brands, handler) = CreateResource();
        string? contentTypeHeader = null;
        handler.Enqueue((request, _) =>
        {
            contentTypeHeader = request.Content?.Headers.ContentType?.ToString();
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(BrandJson, Encoding.UTF8, "application/json"),
            });
        });

        using var file = new MemoryStream(Encoding.ASCII.GetBytes("fake-brand-logo"));
        var brand = await brands.UpdateLogoAsync(
            "org-1", "brand-1", file, "logo.png", "image/png", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Patch, request.Method);
        Assert.Equal("/v2/organizations/org-1/brands/brand-1", request.Uri!.PathAndQuery);
        Assert.NotNull(contentTypeHeader);
        Assert.Equal("multipart/form-data", MediaTypeHeaderValue.Parse(contentTypeHeader).MediaType);

        // The server keys off the part name: "logo" updates full_logo_url.
        Assert.Contains("name=\"logo\"", request.Body);
        Assert.Contains("filename=\"logo.png\"", request.Body);
        Assert.Contains("Content-Type: image/png", request.Body);
        Assert.Contains("fake-brand-logo", request.Body);
        Assert.DoesNotContain("name=\"thumbnail\"", request.Body);
        Assert.Equal("brand-1", brand.Id);
    }

    [Fact]
    public async Task UpdateThumbnailAsync_SendsMultipartThumbnailPart()
    {
        var (brands, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, BrandJson);

        using var file = new MemoryStream(Encoding.ASCII.GetBytes("fake-brand-thumb"));
        await brands.UpdateThumbnailAsync(
            "org-1", "brand-1", file, "thumb.png", "image/png", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Patch, request.Method);
        Assert.Equal("/v2/organizations/org-1/brands/brand-1", request.Uri!.PathAndQuery);
        Assert.Contains("name=\"thumbnail\"", request.Body);
        Assert.Contains("filename=\"thumb.png\"", request.Body);
        Assert.Contains("fake-brand-thumb", request.Body);
        Assert.DoesNotContain("name=\"logo\"", request.Body);
    }

    [Fact]
    public async Task DeleteAsync_SendsDeleteToBrandPath()
    {
        var (brands, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, """{"status": "OK"}""");

        await brands.DeleteAsync("org-1", "brand-1", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Delete, request.Method);
        Assert.Equal("/v2/organizations/org-1/brands/brand-1", request.Uri!.PathAndQuery);
    }

    [Fact]
    public async Task AddEmailDomainAsync_PostsDomainDetails()
    {
        var (brands, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, BrandJson);

        var brand = await brands.AddEmailDomainAsync(
            "org-1",
            "brand-1",
            new AddBrandEmailDomainRequest
            {
                Subdomain = "notify.acme.com",
                LocalPart = "notifications",
                DisplayName = "Acme Notifications",
            },
            TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Post, request.Method);
        Assert.Equal("/v2/organizations/org-1/brands/brand-1/email-domain", request.Uri!.PathAndQuery);
        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        Assert.Equal("notify.acme.com", (string?)body["subdomain"]);
        Assert.Equal("notifications", (string?)body["local_part"]);
        Assert.Equal("Acme Notifications", (string?)body["display_name"]);
        Assert.False(body.ContainsKey("reply_to"));
        Assert.Equal("notify.acme.com", brand.EmailDomain);
    }

    [Fact]
    public async Task RemoveEmailDomainAsync_DeletesEmailDomainPath()
    {
        var (brands, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, BrandJson);

        var brand = await brands.RemoveEmailDomainAsync("org-1", "brand-1", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Delete, request.Method);
        Assert.Equal("/v2/organizations/org-1/brands/brand-1/email-domain", request.Uri!.PathAndQuery);
        Assert.Equal("brand-1", brand.Id);
    }

    [Fact]
    public async Task VerifyEmailDomainAsync_PostsVerifyPath_ParsesStatus()
    {
        var (brands, handler) = CreateResource();
        handler.Enqueue(HttpStatusCode.OK, BrandJson.Replace("\"email_spf_verified\": false", "\"email_spf_verified\": true"));

        var brand = await brands.VerifyEmailDomainAsync("org-1", "brand-1", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Post, request.Method);
        Assert.Equal("/v2/organizations/org-1/brands/brand-1/email-domain/verify", request.Uri!.PathAndQuery);
        Assert.Null(request.Body);
        Assert.True(brand.EmailSpfVerified);
        Assert.False(brand.EmailDkimVerified);
    }
}
