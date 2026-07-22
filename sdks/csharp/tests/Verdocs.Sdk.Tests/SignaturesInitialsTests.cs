using System.Net;
using System.Text;
using Verdocs.Resources;
using Xunit;

namespace Verdocs.Sdk.Tests;

/// <summary>Multipart request shapes and response handling for the Signatures and Initials resources.</summary>
public sealed class SignaturesInitialsTests
{
    private const string TestBaseUrl = "https://api.test";

    private const string SignatureJson = """
        {
          "id": "sig-1",
          "profile_id": "p-1",
          "url": "users/p-1/signatures/sig-1",
          "created_at": "2026-07-01T12:00:00Z",
          "updated_at": "2026-07-01T12:00:00Z"
        }
        """;

    private const string InitialJson = """
        {
          "id": "init-1",
          "profile_id": "p-1",
          "url": "users/p-1/initials/init-1",
          "created_at": "2026-07-01T12:00:00Z",
          "updated_at": "2026-07-01T12:00:00Z"
        }
        """;

    private static (VerdocsEndpoint Endpoint, FakeHttpMessageHandler Handler) CreateEndpoint()
    {
        var handler = new FakeHttpMessageHandler();
        var client = new HttpClient(handler);
        var endpoint = new VerdocsEndpoint(new VerdocsEndpointOptions { BaseUrl = TestBaseUrl }, client);
        return (endpoint, handler);
    }

    [Fact]
    public async Task CreateAsync_Signature_SendsSignaturePartWithContentType()
    {
        var (endpoint, handler) = CreateEndpoint();
        var signatures = new Signatures(endpoint);
        handler.Enqueue(HttpStatusCode.OK, SignatureJson);
        using var content = new MemoryStream(Encoding.ASCII.GetBytes("PNGDATA"));

        var signature = await signatures.CreateAsync(content, "signature.png", "image/png", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Post, request.Method);
        Assert.Equal("/v2/profiles/signatures", request.Uri!.PathAndQuery);

        var body = request.Body!;
        Assert.Contains("name=\"signature\"", body);
        Assert.Contains("filename=\"signature.png\"", body);
        Assert.Contains("Content-Type: image/png", body);
        Assert.Contains("PNGDATA", body);

        Assert.Equal("sig-1", signature.Id);
        Assert.Equal("p-1", signature.ProfileId);
    }

    [Fact]
    public async Task CreateAsync_Signature_NoContentType_DefaultsToOctetStream()
    {
        var (endpoint, handler) = CreateEndpoint();
        var signatures = new Signatures(endpoint);
        handler.Enqueue(HttpStatusCode.OK, SignatureJson);
        using var content = new MemoryStream(Encoding.ASCII.GetBytes("DATA"));

        await signatures.CreateAsync(content, "signature.png", cancellationToken: TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Contains("Content-Type: application/octet-stream", request.Body!);
    }

    [Fact]
    public async Task CreateAsync_Initials_SendsInitialPart()
    {
        var (endpoint, handler) = CreateEndpoint();
        var initials = new Initials(endpoint);
        handler.Enqueue(HttpStatusCode.OK, InitialJson);
        using var content = new MemoryStream(Encoding.ASCII.GetBytes("PNGDATA"));

        var initial = await initials.CreateAsync(content, "initials.png", "image/png", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Post, request.Method);
        Assert.Equal("/v2/profiles/initials", request.Uri!.PathAndQuery);

        // The initials route reads a part named "initial", not "signature".
        var body = request.Body!;
        Assert.Contains("name=\"initial\"", body);
        Assert.DoesNotContain("name=\"signature\"", body);
        Assert.Contains("filename=\"initials.png\"", body);
        Assert.Contains("PNGDATA", body);

        Assert.Equal("init-1", initial.Id);
    }

    [Fact]
    public void CreateAsync_Signature_NullContent_ThrowsSynchronously()
    {
        var (endpoint, _) = CreateEndpoint();
        var signatures = new Signatures(endpoint);

        Assert.Throws<ArgumentNullException>(
            () => { _ = signatures.CreateAsync(null!, "signature.png", cancellationToken: TestContext.Current.CancellationToken); });
    }

    [Fact]
    public void CreateAsync_Initials_EmptyFileName_ThrowsSynchronously()
    {
        var (endpoint, _) = CreateEndpoint();
        var initials = new Initials(endpoint);
        using var content = new MemoryStream([1]);

        Assert.Throws<ArgumentException>(
            () => { _ = initials.CreateAsync(content, "", cancellationToken: TestContext.Current.CancellationToken); });
    }
}
