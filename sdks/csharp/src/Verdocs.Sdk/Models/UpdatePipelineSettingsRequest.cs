using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// Changes for <see cref="Resources.Organizations.UpdatePipelineSettingsAsync"/>. Only the
/// flags set are sent; flags omitted are left unchanged.
/// </summary>
public sealed record UpdatePipelineSettingsRequest
{
    /// <summary>Auto-detect AcroForm (fillable PDF) fields when a document has no text tags.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public bool? ProcessAcroforms { get; init; }

    /// <summary>Process {{...}} text tags in uploaded documents.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public bool? ProcessTags { get; init; }

    /// <summary>Skip, rather than reject, document tags whose role name is empty or invalid.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public bool? IgnoreInvalidRoles { get; init; }

    /// <summary>Skip, rather than reject, document tags that do not form a valid field.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public bool? IgnoreInvalidFields { get; init; }
}
