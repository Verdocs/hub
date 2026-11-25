using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// The 400 body returned by ID verification when the signer needs to retake one or more
/// photos. Read it out of the failed call with <see cref="Resources.Recipients.IsIdRetakeRequired"/>.
/// </summary>
public sealed record IdRetakeResponse
{
    /// <summary>Always "ERROR".</summary>
    public string Status { get; init; } = null!;

    /// <summary>Always "id_retake".</summary>
    public string Code { get; init; } = null!;

    /// <summary>A one-line summary for the signer.</summary>
    public string Error { get; init; } = null!;

    /// <summary>One entry per photo to retake. Never empty.</summary>
    public IReadOnlyList<IdImageErrors> Images { get; init; } = [];

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
