using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// One question in a legacy KBA challenge step (<see cref="RecipientKbaStep.Questions"/>).
/// Distinct from <see cref="KbaQuestion"/>, which is the shape the live verify flow returns on
/// the recipient record.
/// </summary>
public sealed record KbaChallengeQuestion
{
    /// <summary>The kind of question being asked.</summary>
    public string Type { get; init; } = null!;

    /// <summary>The question text shown to the recipient.</summary>
    public string Message { get; init; } = null!;

    /// <summary>The candidate answers. Kept raw because the js-sdk allows both strings and numbers.</summary>
    public IReadOnlyList<JsonElement> Options { get; init; } = [];

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
