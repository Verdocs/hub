using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// One document to attach in a <see cref="CreateEnvelopeRequest"/>. Set exactly one of
/// <see cref="Data"/> or <see cref="Uri"/>. The js-sdk also declares a file variant
/// (ICreateEnvelopeDocumentFromFile), but envelope creation is JSON only on the wire (the
/// deployed handler never reads uploaded file parts), so that variant cannot work and is not
/// ported.
/// </summary>
public sealed record CreateEnvelopeDocument
{
    /// <summary>The order in which the document should be displayed.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public int? Order { get; init; }

    /// <summary>Override the detected MIME type for the document.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Mime { get; init; }

    /// <summary>The name of the document. Used to generate the final filename.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Name { get; init; }

    /// <summary>Base64-encoded content of the document, raw or as a data: URI. The API's 15 MB JSON body cap puts the practical ceiling around 10 to 11 MB of raw file data.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Data { get; init; }

    /// <summary>URI Verdocs downloads the document from. The server sends no auth headers on that fetch, so pre-signed URLs with short (under 60 second) expirations are strongly recommended.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Uri { get; init; }
}
