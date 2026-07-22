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
}
