using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// Body for Templates.CreateFromSharepointAsync, which is dead on the deployed API; see the
/// method notes. The js-sdk sends these fields with camelCase wire names, so this record
/// overrides the snake_case policy to match.
/// </summary>
public sealed record CreateTemplateFromSharepointRequest
{
    /// <summary>Name for the new template.</summary>
    public required string Name { get; init; }

    /// <summary>The Sharepoint site ID the source file is in.</summary>
    [JsonPropertyName("siteId")]
    public required string SiteId { get; init; }

    /// <summary>The item ID of the source file.</summary>
    [JsonPropertyName("itemId")]
    public required string ItemId { get; init; }

    /// <summary>
    /// On-Behalf-Of access token for the request, with an audience of
    /// https://graph.microsoft.com and Read access to the source file. It is used once and
    /// discarded, but generate it with minimal permissions anyway.
    /// </summary>
    [JsonPropertyName("oboToken")]
    public required string OboToken { get; init; }
}
