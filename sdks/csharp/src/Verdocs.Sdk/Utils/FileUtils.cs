namespace Verdocs.Utils;

/// <summary>
/// File and data-URL helpers (js-sdk: Utils/Files.ts). The js-sdk module is browser-bound.
/// fileToDataUrl (File plus FileReader) is adapted here as <see cref="BytesToDataUrl"/>;
/// downloadBlob has no port because it exists only to trigger a browser download dialog
/// through a synthetic anchor click, and .NET callers write bytes to disk directly.
/// </summary>
public static class FileUtils
{
    /// <summary>
    /// Encodes bytes as a base64 data URL with the given MIME type, e.g.
    /// "data:image/png;base64,iVBORw0K...". Adapted from the js-sdk's fileToDataUrl; that
    /// helper returns the browser File's metadata alongside the data URL, but a byte array
    /// has no metadata, so this returns the data URL string directly.
    /// </summary>
    /// <param name="data">The file content.</param>
    /// <param name="contentType">The MIME type to embed, e.g. "application/pdf".</param>
    /// <returns>The "data:&lt;type&gt;;base64,&lt;payload&gt;" string.</returns>
    public static string BytesToDataUrl(byte[] data, string contentType)
    {
        ArgumentNullException.ThrowIfNull(data);
        ArgumentException.ThrowIfNullOrEmpty(contentType);
        return "data:" + contentType + ";base64," + Convert.ToBase64String(data);
    }
}
