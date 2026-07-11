using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>A file attached to a template for display and signing.</summary>
public sealed record TemplateDocument
{
    /// <summary>The unique ID of the document.</summary>
    public string Id { get; init; } = null!;

    /// <summary>The file name of the document.</summary>
    public string Name { get; init; } = null!;

    /// <summary>The template the document is attached to.</summary>
    public string TemplateId { get; init; } = null!;

    /// <summary>Display order among the template's documents.</summary>
    public int Order { get; init; }

    /// <summary>Number of pages in the document.</summary>
    public int Pages { get; init; }

    /// <summary>MIME type of the file.</summary>
    public string Mime { get; init; } = null!;

    /// <summary>Size of the file in bytes.</summary>
    public long Size { get; init; }

    /// <summary>Width and height per page. Kept raw because the wire shape is mid-migration from array to map.</summary>
    public JsonElement? PageSizes { get; init; }

    /// <summary>Creation date and time.</summary>
    public DateTimeOffset? CreatedAt { get; init; }

    /// <summary>Last-update date and time.</summary>
    public DateTimeOffset? UpdatedAt { get; init; }

    /// <summary>Wire fields this seed model does not cover yet, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
