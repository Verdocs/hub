using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// The current step in the js-sdk's legacy KBA flow. The js-sdk models six variants
/// discriminated by kba_step ("none", "complete", "pin", "identity", "challenge", "failed");
/// C# has no union types, so one record covers all six: <see cref="Questions"/> is set only
/// for "challenge" and <see cref="Message"/> only for "failed". NOTE: the /v2/kba routes that
/// return this shape do not exist in the deployed API; real KBA runs through
/// <see cref="Resources.Recipients.VerifySignerAsync"/>.
/// </summary>
public sealed record RecipientKbaStep
{
    /// <summary>The envelope the KBA flow belongs to.</summary>
    public string EnvelopeId { get; init; } = null!;

    /// <summary>The role being verified.</summary>
    public string RoleName { get; init; } = null!;

    /// <summary>The step required next: "none", "complete", "pin", "identity", "challenge", or "failed".</summary>
    public string KbaStep { get; init; } = null!;

    /// <summary>Challenge questions to answer, present only when <see cref="KbaStep"/> is "challenge".</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyList<KbaChallengeQuestion>? Questions { get; init; }

    /// <summary>Failure message to show the user, present only when <see cref="KbaStep"/> is "failed".</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Message { get; init; }

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
