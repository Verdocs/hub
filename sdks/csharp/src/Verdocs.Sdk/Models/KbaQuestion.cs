using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>One challenge or differentiator question in a KBA verification step.</summary>
public sealed record KbaQuestion
{
    /// <summary>The kind of question being asked.</summary>
    public string Type { get; init; } = null!;

    /// <summary>The candidate answers to choose from.</summary>
    public IReadOnlyList<string> Answer { get; init; } = [];

    /// <summary>The question text shown to the recipient.</summary>
    public string Prompt { get; init; } = null!;

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
