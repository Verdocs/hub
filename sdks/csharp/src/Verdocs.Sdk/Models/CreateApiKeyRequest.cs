using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// Details for <see cref="Resources.ApiKeys.CreateAsync"/>. The js-sdk sends a "permission"
/// value here, but the deployed API's schema has no such field and strips it; the real access
/// control is <see cref="GlobalAdmin"/>.
/// </summary>
public sealed record CreateApiKeyRequest
{
    /// <summary>A name used to identify the key in the Verdocs web app.</summary>
    public required string Name { get; init; }

    /// <summary>The profile that calls made with the key will act as.</summary>
    public required string ProfileId { get; init; }

    /// <summary>True to grant the key organization-wide admin rights. The server defaults to false.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public bool? GlobalAdmin { get; init; }
}
