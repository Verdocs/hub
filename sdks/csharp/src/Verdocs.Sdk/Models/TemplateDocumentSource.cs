using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// One document to attach on the JSON path of Templates.CreateAsync. Set exactly one of
/// <see cref="Uri"/> or <see cref="Data"/>. The js-sdk splits this into IDocumentFromUri and
/// IDocumentFromData; C# has no union types, so one record covers both.
/// </summary>
public sealed record TemplateDocumentSource
{
    /// <summary>
    /// Externally accessible URI the server downloads the file from. The fetch sends no auth
    /// headers, so the URI itself must carry any tokens or keys needed to access the file.
    /// </summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Uri { get; init; }

    /// <summary>
    /// Base64-encoded file data, raw or as a data: URI. The whole request body is capped at
    /// 15 MB, so this tops out around 10-11 MB of raw file data; upload larger files through
    /// the multipart overload or <see cref="Resources.TemplateDocuments.CreateAsync"/>.
    /// </summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Data { get; init; }

    /// <summary>A name for the attachment.</summary>
    public required string Name { get; init; }

    /// <summary>Optional MIME type of the file. The server accepts PDF and DOCX.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Mime { get; init; }
}
