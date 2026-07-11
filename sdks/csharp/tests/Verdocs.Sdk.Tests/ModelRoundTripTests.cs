using System.Text.Json;
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
        // Fields the seed does not model yet ride along in extension data.
        Assert.NotNull(model.AdditionalData);
        Assert.Contains("recent_hashes", model.AdditionalData.Keys);
        Assert.Contains("entra_id", model.AdditionalData.Keys);

        Assert.Equal(VolatileJson.NormalizeText(SamplePayloads.User), VolatileJson.NormalizeValue(model));
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
}
