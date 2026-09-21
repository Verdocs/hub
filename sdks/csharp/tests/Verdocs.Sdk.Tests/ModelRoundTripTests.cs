using System.Text.Json;
using System.Text.Json.Nodes;
using Verdocs.Models;
using Xunit;

namespace Verdocs.Sdk.Tests;

/// <summary>
/// Each model deserializes a realistic wire payload and serializes back to the same JSON
/// (compared canonically, with volatile keys masked exactly as the conformance lane masks
/// them). This keeps the snake_case mapping and the extension-data catch-alls honest: a
/// dropped or misnamed field fails the comparison.
/// </summary>
public sealed class ModelRoundTripTests
{
    private static T Deserialize<T>(string json)
    {
        var value = JsonSerializer.Deserialize<T>(json, VerdocsJson.Options);
        Assert.NotNull(value);
        return value;
    }

    [Fact]
    public void RoundTrip_AuthenticateResponse_PreservesPayload()
    {
        var model = Deserialize<AuthenticateResponse>(SamplePayloads.Auth);

        Assert.Equal("id-token-value", model.IdToken);
        Assert.Equal(1798804800, model.AccessTokenExp);

        Assert.Equal(VolatileJson.NormalizeText(SamplePayloads.Auth), VolatileJson.NormalizeValue(model));
    }

    [Fact]
    public void RoundTrip_User_PreservesPayload()
    {
        var model = Deserialize<User>(SamplePayloads.User);

        Assert.Equal("test@example.com", model.Email);
        Assert.Equal("google-1234567890", model.GoogleId);
        Assert.Null(model.B2CId);
        Assert.Equal(new DateTimeOffset(2026, 1, 5, 12, 0, 0, TimeSpan.Zero), model.CreatedAt);
        Assert.True(model.HasPassword);
        Assert.Equal(new DateTimeOffset(2026, 1, 20, 10, 0, 0, TimeSpan.Zero), model.PasswordChangedAt);
        Assert.Equal([SignInProvider.Google], model.SignInProviders);
        Assert.NotNull(model.Mfa);
        Assert.True(model.Mfa.Enabled);
        Assert.Equal(new DateTimeOffset(2026, 2, 1, 9, 0, 0, TimeSpan.Zero), model.Mfa.EnrolledAt);
        Assert.Equal(7, model.Mfa.BackupCodesRemaining);
        // Fields the seed does not model yet ride along in extension data.
        Assert.NotNull(model.AdditionalData);
        Assert.Contains("recent_hashes", model.AdditionalData.Keys);
        Assert.Contains("entra_id", model.AdditionalData.Keys);

        Assert.Equal(VolatileJson.NormalizeText(SamplePayloads.User), VolatileJson.NormalizeValue(model));
    }

    [Fact]
    public void Serialize_User_EmbeddedRecordWithoutAccountSecurityFields_OmitsThem()
    {
        // Only GET /v2/users/me sends the account-security fields; user records embedded in
        // the organization members list are selected without them, so they must read as null
        // and stay off the wire when written back.
        const string embedded = """
            {
              "id": "6f0bb35a-6a1f-4b15-9f52-1f8d3c2a7c11",
              "email": "test@example.com",
              "email_verified": true,
              "first_name": "Test",
              "last_name": "User",
              "phone": null,
              "picture": null,
              "created_at": "2026-01-05T12:00:00.000Z",
              "updated_at": "2026-02-06T08:30:00.000Z"
            }
            """;

        var model = Deserialize<User>(embedded);

        Assert.Null(model.HasPassword);
        Assert.Null(model.PasswordChangedAt);
        Assert.Null(model.SignInProviders);
        Assert.Null(model.Mfa);

        var written = Assert.IsType<JsonObject>(JsonNode.Parse(JsonSerializer.Serialize(model, VerdocsJson.Options)));
        Assert.False(written.ContainsKey("has_password"));
        Assert.False(written.ContainsKey("password_changed_at"));
        Assert.False(written.ContainsKey("sign_in_providers"));
        Assert.False(written.ContainsKey("mfa"));
    }

    [Fact]
    public void RoundTrip_Profile_PreservesPayload()
    {
        var model = Deserialize<Profile>(SamplePayloads.Profile);

        Assert.True(model.Current);
        Assert.Equal(["owner"], model.Roles);
        Assert.NotNull(model.Organization);
        Assert.Equal("Test Organization", model.Organization.Name);
        Assert.True(model.Organization.DeletionProtected);
        Assert.NotNull(model.AdditionalData);
        Assert.Contains("plans", model.AdditionalData.Keys);
        Assert.NotNull(model.Organization.AdditionalData);
        Assert.Contains("entra_tid", model.Organization.AdditionalData.Keys);

        Assert.Equal(VolatileJson.NormalizeText(SamplePayloads.Profile), VolatileJson.NormalizeValue(model));
    }

    [Fact]
    public void RoundTrip_TemplateList_PreservesPayload()
    {
        var model = Deserialize<TemplateList>(SamplePayloads.TemplateList);

        Assert.Equal(2, model.Count);
        Assert.Equal("NDA", model.Templates[1].Name);
        Assert.Equal(14400, model.Templates[1].InitialReminder);

        Assert.Equal(VolatileJson.NormalizeText(SamplePayloads.TemplateList), VolatileJson.NormalizeValue(model));
    }

    [Fact]
    public void RoundTrip_TemplateDetail_PreservesPayload()
    {
        var model = Deserialize<Template>(SamplePayloads.TemplateDetail);

        Assert.Equal("Lease Agreement", model.Name);
        Assert.NotNull(model.Documents);
        Assert.Equal("application/pdf", model.Documents[0].Mime);
        Assert.NotNull(model.Fields);
        Assert.Equal(82.63, model.Fields[0].Width);
        Assert.NotNull(model.Roles);
        Assert.Equal("signer", model.Roles[0].Type);

        Assert.Equal(VolatileJson.NormalizeText(SamplePayloads.TemplateDetail), VolatileJson.NormalizeValue(model));
    }

    [Fact]
    public void RoundTrip_Envelope_PreservesPayload()
    {
        var model = Deserialize<Envelope>(SamplePayloads.Envelope);

        Assert.Equal(EnvelopeStatus.Complete, model.Status);
        Assert.True(model.Signed);
        Assert.Equal(new DateTimeOffset(2026, 2, 1, 10, 0, 0, TimeSpan.Zero), model.CreatedAt);
        Assert.Null(model.CanceledAt);

        Assert.NotNull(model.Recipients);
        var recipient = Assert.Single(model.Recipients);
        Assert.Equal("Tenant", recipient.RoleName);
        Assert.Equal(RecipientStatus.Submitted, recipient.Status);
        Assert.Equal("8f7e6d5c4b3a29181706f5e4d3c2b1a0", recipient.InAppKey);
        Assert.NotNull(recipient.AuthMethodStates);
        Assert.Equal("complete", recipient.AuthMethodStates[RecipientAuthMethod.Passcode]);

        Assert.NotNull(model.Documents);
        Assert.Equal(2, model.Documents.Count);
        Assert.Equal(EnvelopeDocumentType.Certificate, model.Documents[1].Type);
        Assert.Null(model.Documents[1].TemplateDocumentId);

        Assert.NotNull(model.Fields);
        Assert.Equal(82.63, model.Fields[0].Width);
        Assert.NotNull(model.Fields[0].Settings);
        Assert.Equal(72.5, model.Fields[0].Settings!.X);

        Assert.NotNull(model.HistoryEntries);
        Assert.Equal(HistoryEvent.RecipientInvited, model.HistoryEntries[0].Event);

        Assert.NotNull(model.AccessKeys);
        var accessKey = Assert.Single(model.AccessKeys);
        Assert.Equal(AccessKeyType.InApp, accessKey.Type);
        Assert.Equal("Tenant", accessKey.RecipientName);
        Assert.Null(accessKey.RoleName);

        // Fields the models do not declare ride along in extension data.
        Assert.NotNull(model.AdditionalData);
        Assert.Contains("separate_cert", model.AdditionalData.Keys);

        Assert.Equal(VolatileJson.NormalizeText(SamplePayloads.Envelope), VolatileJson.NormalizeValue(model));
    }

    [Fact]
    public void RoundTrip_Webhook_PreservesPayload()
    {
        var model = Deserialize<Webhook>(SamplePayloads.Webhook);

        Assert.Equal(WebhookAuthMethod.None, model.AuthMethod);
        Assert.True(model.Active);
        Assert.True(model.Events[WebhookEvent.EnvelopeCreated]);
        Assert.False(model.Events[WebhookEvent.EnvelopeCanceled]);
        Assert.Null(model.LastSuccess);

        Assert.Equal(VolatileJson.NormalizeText(SamplePayloads.Webhook), VolatileJson.NormalizeValue(model));
    }

    [Fact]
    public void RoundTrip_Brand_PreservesPayload()
    {
        var model = Deserialize<Brand>(SamplePayloads.Brand);

        Assert.Equal("acme", model.Key);
        Assert.Equal(DomainStatus.Active, model.AppDomainStatus);
        Assert.Equal(EmailDomainStatus.Verified, model.EmailDomainStatus);
        Assert.True(model.EmailSpfVerified);
        Assert.False(model.EmailDmarcVerified);
        Assert.Equal(3, model.EmailDkimTokens.Count);

        Assert.Equal(VolatileJson.NormalizeText(SamplePayloads.Brand), VolatileJson.NormalizeValue(model));
    }

    [Fact]
    public void RoundTrip_ApiKey_PreservesPayload()
    {
        var model = Deserialize<ApiKey>(SamplePayloads.ApiKey);

        Assert.Equal("6f7a8b9c-0d1e-4f2a-3b4c-5d6e7f8a9b0c", model.ClientId);
        Assert.Equal("Default", model.Name);
        Assert.False(model.GlobalAdmin);
        Assert.Null(model.ClientSecret);
        Assert.Equal(new DateTimeOffset(2026, 1, 5, 12, 0, 0, TimeSpan.Zero), model.CreatedAt);
        Assert.Null(model.LastUsedAt);
        // Every field of the deployed shape is modeled, so nothing lands in extension data.
        Assert.Null(model.AdditionalData);

        Assert.Equal(VolatileJson.NormalizeText(SamplePayloads.ApiKey), VolatileJson.NormalizeValue(model));
    }

    [Fact]
    public void RoundTrip_Group_PreservesPayload()
    {
        var model = Deserialize<Group>(SamplePayloads.Group);

        Assert.Equal("Sales", model.Name);
        Assert.Contains("envelope:create", model.Permissions);
        Assert.NotNull(model.Profiles);
        var membership = Assert.Single(model.Profiles);
        Assert.Equal(model.Id, membership.GroupId);

        Assert.Equal(VolatileJson.NormalizeText(SamplePayloads.Group), VolatileJson.NormalizeValue(model));
    }

    [Fact]
    public void RoundTrip_Notification_PreservesPayload()
    {
        var model = Deserialize<Notification>(SamplePayloads.Notification);

        Assert.Equal(EventName.EnvelopeCompleted, model.EventName);
        Assert.False(model.Read);
        Assert.Equal(new DateTimeOffset(2026, 2, 3, 16, 20, 10, TimeSpan.Zero), model.Time);

        Assert.Equal(VolatileJson.NormalizeText(SamplePayloads.Notification), VolatileJson.NormalizeValue(model));
    }

    [Fact]
    public void RoundTrip_NotificationTemplate_PreservesPayload()
    {
        var model = Deserialize<NotificationTemplate>(SamplePayloads.NotificationTemplate);

        Assert.Equal(NotificationType.Email, model.Type);
        Assert.Equal(EventName.EnvelopeCompleted, model.EventName);
        Assert.Null(model.TemplateId);
        Assert.NotNull(model.HtmlTemplate);

        Assert.Equal(VolatileJson.NormalizeText(SamplePayloads.NotificationTemplate), VolatileJson.NormalizeValue(model));
    }

    [Fact]
    public void RoundTrip_Entitlement_PreservesPayload()
    {
        var model = Deserialize<Entitlement>(SamplePayloads.Entitlement);

        Assert.Equal(EntitlementFeature.Envelope, model.Feature);
        Assert.Equal(100, model.MonthlyMax);
        Assert.Equal(1200, model.YearlyMax);
        Assert.Null(model.ContractId);

        Assert.Equal(VolatileJson.NormalizeText(SamplePayloads.Entitlement), VolatileJson.NormalizeValue(model));
    }

    [Fact]
    public void RoundTrip_OrganizationInvitation_PreservesPayload()
    {
        var model = Deserialize<OrganizationInvitation>(SamplePayloads.OrganizationInvitation);

        Assert.Equal("newhire@example.com", model.Email);
        Assert.Equal("pending", model.Status);
        Assert.Equal("member", model.Role);
        Assert.Null(model.Token);

        Assert.Equal(VolatileJson.NormalizeText(SamplePayloads.OrganizationInvitation), VolatileJson.NormalizeValue(model));
    }

    [Fact]
    public void RoundTrip_PendingWebhook_PreservesPayload()
    {
        var model = Deserialize<PendingWebhook>(SamplePayloads.PendingWebhook);

        Assert.Equal(503, model.LastStatus);
        Assert.Equal("Service Unavailable", model.LastResult);
        Assert.Null(model.DeliveredAt);
        Assert.NotNull(model.Body);

        Assert.Equal(VolatileJson.NormalizeText(SamplePayloads.PendingWebhook), VolatileJson.NormalizeValue(model));
    }
}
