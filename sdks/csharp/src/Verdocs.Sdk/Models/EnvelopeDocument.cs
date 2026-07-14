using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// An individual document inside an envelope package: a signer-supplied attachment or the
/// Verdocs-generated certificate.
/// </summary>
public sealed record EnvelopeDocument
{
    /// <summary>The unique ID of the document.</summary>
    public string Id { get; init; } = null!;

    /// <summary>The envelope the document belongs to.</summary>
    public string EnvelopeId { get; init; } = null!;

    /// <summary>The template document this one was created from, or null for envelopes created without templates.</summary>
    public string? TemplateDocumentId { get; init; }

    /// <summary>Display order among the envelope's documents.</summary>
    public int Order { get; init; }

    /// <summary>Attachment or certificate; see <see cref="EnvelopeDocumentType"/>.</summary>
    public string Type { get; init; } = null!;

    /// <summary>The file name of the document.</summary>
    public string Name { get; init; } = null!;

    /// <summary>Number of pages in the document.</summary>
    public int Pages { get; init; }

    /// <summary>MIME type of the file.</summary>
    public string Mime { get; init; } = null!;

    /// <summary>Size of the file in bytes.</summary>
    public long Size { get; init; }

    /// <summary>True once the file is signed. Documents sign first, then the certificate, then the envelope is marked signed.</summary>
    public bool Signed { get; init; }

    /// <summary>Width and height per page. Kept raw because the wire shape is mid-migration from array to map.</summary>
    public JsonElement? PageSizes { get; init; }

    /// <summary>Creation date and time.</summary>
    public DateTimeOffset CreatedAt { get; init; }

    /// <summary>Last-update date and time.</summary>
    public DateTimeOffset UpdatedAt { get; init; }

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
