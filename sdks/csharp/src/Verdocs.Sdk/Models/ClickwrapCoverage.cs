using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>How many people have accepted an agreement, as <see cref="Resources.Clickwrap.GetCoverageAsync"/> returns it. Counts distinct people, not clicks.</summary>
public sealed record ClickwrapCoverage
{
    /// <summary>The agreement's ID.</summary>
    public string AgreementId { get; init; } = null!;

    /// <summary>The newest published version that requires re-acceptance, or 0 when none does.</summary>
    public int CutoffNumber { get; init; }

    /// <summary>Distinct people who accepted any version.</summary>
    public int AcceptedAny { get; init; }

    /// <summary>Distinct people who accepted a version at or after the cutoff.</summary>
    public int Current { get; init; }

    /// <summary>One entry per published version, newest first.</summary>
    public IReadOnlyList<ClickwrapCoverageVersion> Versions { get; init; } = [];

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
