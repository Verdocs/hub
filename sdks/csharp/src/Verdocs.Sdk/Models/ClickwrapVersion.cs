using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>One version of an agreement's text. Published versions never change.</summary>
public sealed record ClickwrapVersion
{
    /// <summary>The version's ID.</summary>
    public string Id { get; init; } = null!;

    /// <summary>The agreement this version belongs to.</summary>
    public string AgreementId { get; init; } = null!;

    /// <summary>The version number: 1, 2, 3, unique within the agreement.</summary>
    public int Number { get; init; }

    /// <summary>draft or published; see <see cref="ClickwrapVersionStatus"/>.</summary>
    public string Status { get; init; } = null!;

    /// <summary>The agreement text as sanitized HTML.</summary>
    public string Content { get; init; } = null!;

    /// <summary>SHA-256 hex of the content, set when the version is published.</summary>
    public string? ContentHash { get; init; }

    /// <summary>Whether everyone must accept this version again, chosen at publish.</summary>
    public bool RequiresReacceptance { get; init; }

    /// <summary>What changed, as written at publish.</summary>
    public string? ChangeSummary { get; init; }

    /// <summary>When the version was published, or null for a draft.</summary>
    public DateTimeOffset? PublishedAt { get; init; }

    /// <summary>The profile that published the version.</summary>
    public string? PublishedBy { get; init; }

    /// <summary>When the version was created.</summary>
    public DateTimeOffset CreatedAt { get; init; }

    /// <summary>When the version was last edited.</summary>
    public DateTimeOffset UpdatedAt { get; init; }

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
