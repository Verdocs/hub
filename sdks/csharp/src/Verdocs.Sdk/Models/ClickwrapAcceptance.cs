using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>One recorded acceptance or decline, as <see cref="Resources.Clickwrap.GetAcceptanceAsync"/> returns it. Records never change.</summary>
public sealed record ClickwrapAcceptance
{
    /// <summary>The record's ID.</summary>
    public string Id { get; init; } = null!;

    /// <summary>The organization that owns the record.</summary>
    public string OrganizationId { get; init; } = null!;

    /// <summary>The session it was recorded in, or null for headless records.</summary>
    public string? SessionId { get; init; }

    /// <summary>The person's ID in your own system.</summary>
    public string UserId { get; init; } = null!;

    /// <summary>The metadata kept with the record.</summary>
    public IReadOnlyDictionary<string, string>? Metadata { get; init; }

    /// <summary>What the person did; see <see cref="ClickwrapOutcome"/>.</summary>
    public string Outcome { get; init; } = null!;

    /// <summary>Where the outcome was recorded; see <see cref="ClickwrapSurface"/>.</summary>
    public string Surface { get; init; } = null!;

    /// <summary>How the component showed the terms, or null for headless records; see <see cref="ClickwrapMode"/>.</summary>
    public string? Mode { get; init; }

    /// <summary>Whether the person had to scroll to the end, or null for headless records.</summary>
    public bool? RequireScroll { get; init; }

    /// <summary>The person's IP address.</summary>
    public string? IpAddress { get; init; }

    /// <summary>The person's user agent.</summary>
    public string? UserAgent { get; init; }

    /// <summary>The person's locale.</summary>
    public string? Locale { get; init; }

    /// <summary>The person's IANA timezone.</summary>
    public string? Timezone { get; init; }

    /// <summary>The browser window the terms were shown in.</summary>
    public ClickwrapViewport? Viewport { get; init; }

    /// <summary>Each checkbox label and the button label, as shown.</summary>
    public ClickwrapLabels? Labels { get; init; }

    /// <summary>How far the person scrolled, from 0 to 1.</summary>
    public double? ScrollDepth { get; init; }

    /// <summary>Whether the person scrolled to the end.</summary>
    public bool? ScrolledToEnd { get; init; }

    /// <summary>How long the terms were on screen, in milliseconds.</summary>
    public int? TimeOnTermsMs { get; init; }

    /// <summary>SHA-256 hex of the stored presentation, or null when there isn't one.</summary>
    public string? PresentationHash { get; init; }

    /// <summary>Where the presentation came from; see <see cref="ClickwrapPresentationSource"/>.</summary>
    public string PresentationSource { get; init; } = null!;

    /// <summary>Whether a presentation is stored, so a replay can be downloaded.</summary>
    public bool HasPresentation { get; init; }

    /// <summary>Who reported the browser details; see <see cref="ClickwrapReporter"/>.</summary>
    public string ReportedBy { get; init; } = null!;

    /// <summary>The record's place in the organization's hash chain.</summary>
    public int Sequence { get; init; }

    /// <summary>The previous record's hash, or null for the first record in the chain.</summary>
    public string? PrevHash { get; init; }

    /// <summary>This record's hash.</summary>
    public string RecordHash { get; init; } = null!;

    /// <summary>When the record was written, by our server's clock.</summary>
    public DateTimeOffset CreatedAt { get; init; }

    /// <summary>The agreement versions in the record.</summary>
    public IReadOnlyList<ClickwrapAcceptanceItem> Items { get; init; } = [];

    /// <summary>What happened while the person read, oldest first. Empty for headless records.</summary>
    public IReadOnlyList<ClickwrapAcceptanceEvent> Events { get; init; } = [];

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
