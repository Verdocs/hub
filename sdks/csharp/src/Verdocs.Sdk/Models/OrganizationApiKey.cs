using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// The API key automatically created when a child organization is created, returned inline on
/// that response so callers skip a follow-up request. The js-sdk marks the field deprecated:
/// API v3 will move it to the top level of the response.
/// </summary>
public sealed record OrganizationApiKey
{
    /// <summary>The new key's client ID.</summary>
    public string ClientId { get; init; } = null!;

    /// <summary>The new key's secret. This is the only time it is returned.</summary>
    public string ClientSecret { get; init; } = null!;

    /// <summary>Display name for the key. Always "Default".</summary>
    public string Name { get; init; } = null!;

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
