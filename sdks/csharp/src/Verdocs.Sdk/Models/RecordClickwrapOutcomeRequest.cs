using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>The fields for <see cref="Resources.Clickwrap.RecordOutcomeAsync"/>, which records an outcome from your own interface.</summary>
public sealed record RecordClickwrapOutcomeRequest
{
    /// <summary>The person's ID in your own system.</summary>
    public required string UserId { get; init; }

    /// <summary>What the person did; see <see cref="ClickwrapOutcome"/>.</summary>
    public required string Outcome { get; init; }

    /// <summary>The agreement versions the person saw, each agreement once. Up to 20.</summary>
    public required IReadOnlyList<ClickwrapOutcomeAgreement> Agreements { get; init; }

    /// <summary>Flat string values to keep with the record, such as an email. Up to 50 keys.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyDictionary<string, string>? Metadata { get; init; }

    /// <summary>The person's IP address, as you saw it.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? IpAddress { get; init; }

    /// <summary>The person's user agent, as you saw it.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? UserAgent { get; init; }

    /// <summary>The person's locale, such as en-US.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Locale { get; init; }

    /// <summary>The person's IANA timezone, such as America/Denver.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Timezone { get; init; }

    /// <summary>Each checkbox label and the button label, as you showed them.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public ClickwrapLabels? Labels { get; init; }

    /// <summary>What was on screen.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public ClickwrapCustomerPresentation? Presentation { get; init; }
}
