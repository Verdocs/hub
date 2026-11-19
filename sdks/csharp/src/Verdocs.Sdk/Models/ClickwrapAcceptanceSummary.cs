using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>A short form of one record, as searches and webhooks return it.</summary>
public sealed record ClickwrapAcceptanceSummary
{
    /// <summary>The record's ID.</summary>
    public string Id { get; init; } = null!;

    /// <summary>What the person did; see <see cref="ClickwrapOutcome"/>.</summary>
    public string Outcome { get; init; } = null!;

    /// <summary>The person's ID in your own system.</summary>
    public string UserId { get; init; } = null!;

    /// <summary>The metadata kept with the record.</summary>
    public IReadOnlyDictionary<string, string>? Metadata { get; init; }

    /// <summary>Where the outcome was recorded; see <see cref="ClickwrapSurface"/>.</summary>
    public string Surface { get; init; } = null!;

    /// <summary>Who reported the browser details; see <see cref="ClickwrapReporter"/>.</summary>
    public string ReportedBy { get; init; } = null!;

    /// <summary>When the record was written, by our server's clock.</summary>
    public DateTimeOffset CreatedAt { get; init; }

    /// <summary>The agreement versions in the record.</summary>
    public IReadOnlyList<ClickwrapAcceptanceSummaryAgreement> Agreements { get; init; } = [];

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
