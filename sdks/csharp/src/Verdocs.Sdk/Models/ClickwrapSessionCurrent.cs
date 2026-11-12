using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>The answer from <see cref="Resources.Clickwrap.CreateSessionAsync"/> when the person is already current: there's nothing to show and no session.</summary>
public sealed record ClickwrapSessionCurrent : ClickwrapSessionResult
{
    /// <summary>The status of each requested agreement.</summary>
    public IReadOnlyList<ClickwrapStatus> Agreements { get; init; } = [];

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
