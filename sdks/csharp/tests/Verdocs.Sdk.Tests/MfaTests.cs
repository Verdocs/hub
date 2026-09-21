using System.Net;
using System.Text.Json.Nodes;
using Verdocs.Models;
using Xunit;

namespace Verdocs.Sdk.Tests;

/// <summary>Request shapes and response handling for the Mfa resource.</summary>
public sealed class MfaTests
{
    private const string TestBaseUrl = "https://api.test";

    private const string BackupCodesPayload = """
        {"backup_codes": ["ab12-cd34", "ef56-gh78"]}
        """;

    private static (VerdocsEndpoint Endpoint, FakeHttpMessageHandler Handler) CreateEndpoint()
    {
        var handler = new FakeHttpMessageHandler();
        var client = new HttpClient(handler);
        var endpoint = new VerdocsEndpoint(new VerdocsEndpointOptions { BaseUrl = TestBaseUrl }, client);
        return (endpoint, handler);
    }

    [Fact]
    public async Task GetMfaStatusAsync_RequestsMfaPath_ParsesEnabledStatus()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.OK, """
            {"enabled": true, "type": "totp", "enrolled_at": "2026-09-01T12:00:00.000Z", "backup_codes_remaining": 8}
            """);

        var status = await endpoint.Mfa.GetMfaStatusAsync(TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Get, request.Method);
        Assert.Equal("/v2/users/mfa", request.Uri!.PathAndQuery);
        Assert.Null(request.Body);

        Assert.True(status.Enabled);
        Assert.Equal(MfaType.Totp, status.Type);
        Assert.Equal(new DateTimeOffset(2026, 9, 1, 12, 0, 0, TimeSpan.Zero), status.EnrolledAt);
        Assert.Equal(8, status.BackupCodesRemaining);
    }

    [Fact]
    public async Task GetMfaStatusAsync_NotEnrolled_ParsesNulls()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.OK, """{"enabled": false, "type": null, "enrolled_at": null, "backup_codes_remaining": 0}""");

        var status = await endpoint.Mfa.GetMfaStatusAsync(TestContext.Current.CancellationToken);

        Assert.False(status.Enabled);
        Assert.Null(status.Type);
        Assert.Null(status.EnrolledAt);
        Assert.Equal(0, status.BackupCodesRemaining);
    }

    [Fact]
    public async Task EnrollMfaAsync_PostsToEnrollPath_ParsesPendingSecret()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.OK, """
            {
              "secret": "JBSWY3DPEHPK3PXP",
              "otpauth_url": "otpauth://totp/Verdocs:you%40example.com?secret=JBSWY3DPEHPK3PXP&issuer=Verdocs",
              "expires_at": "2026-09-18T09:00:00.000Z"
            }
            """);

        var enrollment = await endpoint.Mfa.EnrollMfaAsync(TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Post, request.Method);
        Assert.Equal("/v2/users/mfa/enroll", request.Uri!.PathAndQuery);
        Assert.Null(request.Body);

        Assert.Equal("JBSWY3DPEHPK3PXP", enrollment.Secret);
        Assert.StartsWith("otpauth://totp/", enrollment.OtpauthUrl, StringComparison.Ordinal);
        Assert.Equal(new DateTimeOffset(2026, 9, 18, 9, 0, 0, TimeSpan.Zero), enrollment.ExpiresAt);
    }

    [Fact]
    public async Task VerifyMfaEnrollmentAsync_PostsCode_ParsesBackupCodes()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.OK, BackupCodesPayload);

        var backup = await endpoint.Mfa.VerifyMfaEnrollmentAsync("123456", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Post, request.Method);
        Assert.Equal("/v2/users/mfa/enroll/verify", request.Uri!.PathAndQuery);
        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        var property = Assert.Single(body);
        Assert.Equal("code", property.Key);
        Assert.Equal("123456", (string?)property.Value);

        Assert.Equal(["ab12-cd34", "ef56-gh78"], backup.BackupCodes);
    }

    [Fact]
    public async Task RegenerateBackupCodesAsync_PostsCode_ParsesBackupCodes()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.OK, BackupCodesPayload);

        var backup = await endpoint.Mfa.RegenerateBackupCodesAsync("654321", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Post, request.Method);
        Assert.Equal("/v2/users/mfa/backup-codes", request.Uri!.PathAndQuery);
        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        Assert.Equal("654321", (string?)body["code"]);

        Assert.Equal(2, backup.BackupCodes.Count);
    }

    [Fact]
    public async Task DisableMfaAsync_SendsDeleteWithCodeBody()
    {
        var (endpoint, handler) = CreateEndpoint();
        handler.Enqueue(HttpStatusCode.OK, """{"status": "OK"}""");

        await endpoint.Mfa.DisableMfaAsync("ab12-cd34", TestContext.Current.CancellationToken);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Delete, request.Method);
        Assert.Equal("/v2/users/mfa", request.Uri!.PathAndQuery);
        // The handler reads the code from a JSON body on the DELETE, matching the js-sdk.
        var body = Assert.IsType<JsonObject>(JsonNode.Parse(request.Body!));
        var property = Assert.Single(body);
        Assert.Equal("code", property.Key);
        Assert.Equal("ab12-cd34", (string?)property.Value);
    }

    [Fact]
    public void CodeTakingCalls_EmptyCode_ThrowSynchronously()
    {
        var (endpoint, _) = CreateEndpoint();
        var cancellationToken = TestContext.Current.CancellationToken;

        Assert.Throws<ArgumentException>(() => { _ = endpoint.Mfa.VerifyMfaEnrollmentAsync("", cancellationToken); });
        Assert.Throws<ArgumentException>(() => { _ = endpoint.Mfa.RegenerateBackupCodesAsync("", cancellationToken); });
        Assert.Throws<ArgumentException>(() => { _ = endpoint.Mfa.DisableMfaAsync("", cancellationToken); });
    }
}
