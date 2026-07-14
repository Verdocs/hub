using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>One profile's star on one template.</summary>
public sealed record Star
{
    /// <summary>The starred template.</summary>
    public string TemplateId { get; init; } = null!;

    /// <summary>The profile that starred it.</summary>
    public string ProfileId { get; init; } = null!;

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
