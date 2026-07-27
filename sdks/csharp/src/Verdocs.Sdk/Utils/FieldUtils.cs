namespace Verdocs.Utils;

/// <summary>
/// Field-placement math (js-sdk: Utils/Fields.ts). Field records store positions in PDF
/// coordinates (origin bottom-left, in document units); rendering surfaces use screen
/// coordinates (origin top-left, in pixels). These helpers convert between the two spaces.
/// </summary>
public static class FieldUtils
{
    /// <summary>
    /// Returns the rendered top offset for a field. Flips the y axis: PDF y grows upward from
    /// the page bottom, screen y grows downward from the top.
    /// </summary>
    /// <param name="y">The field's PDF y position (bottom edge).</param>
    /// <param name="fieldHeight">The field's height in document units.</param>
    /// <param name="iTextHeight">The rendered page height in pixels.</param>
    /// <param name="yRatio">Pixels per document unit on the y axis.</param>
    /// <returns>The top offset in pixels.</returns>
    /// <sdkOperation>fieldUtil.getRTop</sdkOperation>
    /// <sdkGroup>FieldUtils</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
    public static double GetRTop(double y, double fieldHeight, double iTextHeight, double yRatio)
    {
        return iTextHeight - (y + fieldHeight) * yRatio;
    }

    /// <summary>Returns the rendered left offset for a field: its PDF x scaled to pixels.</summary>
    /// <param name="x">The field's PDF x position.</param>
    /// <param name="ratio">Pixels per document unit on the x axis.</param>
    /// <returns>The left offset in pixels.</returns>
    /// <sdkOperation>fieldUtil.getRLeft</sdkOperation>
    /// <sdkGroup>FieldUtils</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
    public static double GetRLeft(double x, double ratio)
    {
        return x * ratio;
    }

    /// <summary>Returns a document-space value scaled to rendered pixels.</summary>
    /// <param name="y">The value in document units.</param>
    /// <param name="ratio">Pixels per document unit.</param>
    /// <returns>The value in pixels.</returns>
    /// <sdkOperation>fieldUtil.getRValue</sdkOperation>
    /// <sdkGroup>FieldUtils</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
    public static double GetRValue(double y, double ratio)
    {
        return y * ratio;
    }

    /// <summary>Returns a value scaled by a ratio.</summary>
    /// <param name="r">The value to scale.</param>
    /// <param name="n">The ratio to scale by.</param>
    /// <returns>The scaled value.</returns>
    /// <sdkOperation>fieldUtil.rescale</sdkOperation>
    /// <sdkGroup>FieldUtils</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
    public static double Rescale(double r, double n)
    {
        return r * n;
    }

    /// <summary>
    /// Encodes raw bytes as a base64 string. Adapted from the js-sdk's blobToBase64, which
    /// reads a browser Blob through FileReader and resolves a data URL. A byte array carries
    /// no MIME type, so this returns the bare base64 payload; use
    /// <see cref="FileUtils.BytesToDataUrl"/> when the "data:&lt;type&gt;;base64," prefix is needed.
    /// </summary>
    /// <param name="data">The bytes to encode.</param>
    /// <returns>The base64-encoded string.</returns>
    /// <sdkOperation>fieldUtil.blobToBase64</sdkOperation>
    /// <sdkGroup>FieldUtils</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
    public static string BytesToBase64(byte[] data)
    {
        ArgumentNullException.ThrowIfNull(data);
        return Convert.ToBase64String(data);
    }
}
