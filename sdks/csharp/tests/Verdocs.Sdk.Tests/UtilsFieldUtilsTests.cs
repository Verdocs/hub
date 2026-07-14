using Verdocs.Utils;
using Xunit;

namespace Verdocs.Sdk.Tests;

/// <summary>
/// Field-placement math (Verdocs.Utils.FieldUtils) plus the byte-encoding adaptations of the
/// browser-bound js-sdk helpers: FieldUtils.BytesToBase64 (js blobToBase64) and its
/// data-URL sibling FileUtils.BytesToDataUrl (js fileToDataUrl).
/// </summary>
public sealed class UtilsFieldUtilsTests
{
    [Fact]
    public void GetRTop_FieldAboveBottom_FlipsTheYAxis()
    {
        // A field 20 units tall sitting 10 units above the page bottom, rendered on a
        // 792px-tall page at 1.5px per unit: 792 - (10 + 20) * 1.5.
        Assert.Equal(747.0, FieldUtils.GetRTop(10, 20, 792, 1.5));
    }

    [Fact]
    public void GetRTop_AtPageBottom_ReturnsPageHeight()
    {
        Assert.Equal(792.0, FieldUtils.GetRTop(0, 0, 792, 1.5));
    }

    [Fact]
    public void GetRLeft_ScalesByRatio()
    {
        Assert.Equal(75.0, FieldUtils.GetRLeft(100, 0.75));
    }

    [Fact]
    public void GetRValue_ScalesByRatio()
    {
        Assert.Equal(75.0, FieldUtils.GetRValue(50, 1.5));
    }

    [Fact]
    public void Rescale_ScalesByRatio()
    {
        Assert.Equal(60.0, FieldUtils.Rescale(1.5, 40));
        Assert.Equal(0.0, FieldUtils.Rescale(0, 40));
    }

    [Fact]
    public void BytesToBase64_Payload_ReturnsBareBase64()
    {
        Assert.Equal("aGVsbG8=", FieldUtils.BytesToBase64("hello"u8.ToArray()));
        Assert.Equal("", FieldUtils.BytesToBase64([]));

        // Bare payload, no data-URL prefix; that lives in FileUtils.BytesToDataUrl.
        Assert.DoesNotContain("data:", FieldUtils.BytesToBase64("hello"u8.ToArray()), StringComparison.Ordinal);
    }

    [Fact]
    public void BytesToDataUrl_PayloadAndContentType_BuildsDataUrl()
    {
        Assert.Equal("data:text/plain;base64,aGVsbG8=", FileUtils.BytesToDataUrl("hello"u8.ToArray(), "text/plain"));
        Assert.Equal("data:application/pdf;base64,", FileUtils.BytesToDataUrl([], "application/pdf"));
    }

    [Fact]
    public void BytesToDataUrl_PrefixShape_MatchesFileReaderOutput()
    {
        // The prefix must look exactly like FileReader.readAsDataURL output so downstream
        // consumers can split on the first comma.
        var url = FileUtils.BytesToDataUrl([0x89, 0x50, 0x4E, 0x47], "image/png");
        var separator = url.IndexOf(',', StringComparison.Ordinal);
        Assert.Equal("data:image/png;base64", url[..separator]);
        Assert.Equal("iVBORw==", url[(separator + 1)..]);
    }
}
