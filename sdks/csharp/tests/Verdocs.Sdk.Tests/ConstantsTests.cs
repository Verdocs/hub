using Verdocs.Models;
using Xunit;

namespace Verdocs.Sdk.Tests;

/// <summary>
/// The shared constant lists must stay aligned with the js-sdk's Lists.ts and BaseTypes.ts so
/// every SDK agrees on field types, default sizes, permissions, and webhook event names.
/// </summary>
public sealed class ConstantsTests
{
    [Fact]
    public void FieldTypes_MatchesJsSdk_CountAndOrder()
    {
        Assert.Equal(11, Lists.FieldTypes.Count);
        Assert.Equal(FieldType.Textbox, Lists.FieldTypes[0]);
        Assert.Equal(FieldType.Payment, Lists.FieldTypes[^1]);
    }

    [Fact]
    public void DefaultFieldSizes_EveryFieldType_HasWidthAndHeight()
    {
        foreach (var fieldType in Lists.FieldTypes)
        {
            Assert.True(Lists.DefaultFieldWidths.ContainsKey(fieldType));
            Assert.True(Lists.DefaultFieldHeights.ContainsKey(fieldType));
        }

        Assert.Equal(Lists.FieldTypes.Count, Lists.DefaultFieldWidths.Count);
        Assert.Equal(Lists.FieldTypes.Count, Lists.DefaultFieldHeights.Count);
    }

    [Fact]
    public void AllPermissions_MatchesJsSdk_Count()
    {
        Assert.Equal(25, Lists.AllPermissions.Count);
        Assert.Contains("envelope:create", Lists.AllPermissions);
        Assert.Contains("template:creator:create:public", Lists.AllPermissions);
    }

    [Fact]
    public void WebhookEventAll_MatchesJsSdk_CountAndEntries()
    {
        Assert.Equal(23, WebhookEvent.All.Count);
        Assert.Equal(WebhookEvent.EnvelopeCreated, WebhookEvent.All[0]);
        Assert.Equal(WebhookEvent.OrganizationDeleted, WebhookEvent.All[^1]);
        Assert.Distinct(WebhookEvent.All);
    }

    [Fact]
    public void EntitlementFeature_IdVerification_MatchesJsSdk()
    {
        Assert.Equal("id_verification", EntitlementFeature.IdVerification);
        Assert.Equal("id_verification_plus", EntitlementFeature.IdVerificationPlus);

        // The API renamed id_auth, and the js-sdk dropped it from TEntitlement.
        Assert.Null(typeof(EntitlementFeature).GetField("IdAuth"));
    }

    [Fact]
    public void IdVerificationValues_MatchJsSdk()
    {
        Assert.Equal("base", RecipientIdVerificationLevel.Base);
        Assert.Equal("plus", RecipientIdVerificationLevel.Plus);
        Assert.Equal("driverLicense", IdDocumentType.DriverLicense);
        Assert.Equal("idCard", IdDocumentType.IdCard);
        Assert.Equal("passport", IdDocumentType.Passport);
        Assert.Equal("front_image", IdImageField.FrontImage);
        Assert.Equal("back_image", IdImageField.BackImage);
        Assert.Equal("face_image", IdImageField.FaceImage);
    }

    [Fact]
    public void IdImageError_MatchesJsSdk_AllTwelveValues()
    {
        string[] expected =
        [
            "Image Too Small",
            "Image Too Large",
            "Document Missing Four Corners",
            "Document Too Small",
            "Document Border Too Small",
            "Document is Skewed",
            "Face Image Not Detected",
            "Barcode Not Detected",
            "Image same as Document Image",
            "Image Error",
            "ID Not Readable",
            "Poor Quality Selfie",
        ];

        var actual = typeof(IdImageError)
            .GetFields(System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Static)
            .Select(field => (string)field.GetValue(null)!)
            .ToArray();

        // Reflection doesn't promise declaration order, so compare as sets.
        Assert.Equal(expected.Order(StringComparer.Ordinal), actual.Order(StringComparer.Ordinal));
    }
}
