using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>The association between one tag and one template.</summary>
public sealed record TemplateTag
{
    /// <summary>The name of the tag.</summary>
    public string TagName { get; init; } = null!;

    /// <summary>The template the tag is attached to.</summary>
    public string TemplateId { get; init; } = null!;

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
