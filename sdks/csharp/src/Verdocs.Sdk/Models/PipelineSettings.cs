using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// Org-level document-pipeline automation flags. Every flag is opt-in and defaults to false,
/// so keys the server omits deserialize to the correct value.
/// </summary>
public sealed record PipelineSettings
{
    /// <summary>Auto-detect AcroForm (fillable PDF) fields when a document has no text tags.</summary>
    public bool ProcessAcroforms { get; init; }

    /// <summary>Process {{...}} text tags in uploaded documents.</summary>
    public bool ProcessTags { get; init; }

    /// <summary>Skip, rather than reject, document tags whose role name is empty or invalid.</summary>
    public bool IgnoreInvalidRoles { get; init; }

    /// <summary>Skip, rather than reject, document tags that do not form a valid field.</summary>
    public bool IgnoreInvalidFields { get; init; }

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
