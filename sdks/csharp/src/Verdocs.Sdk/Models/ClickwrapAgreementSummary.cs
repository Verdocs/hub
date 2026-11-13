using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>An agreement with its current version and open draft, as <see cref="Resources.Clickwrap.ListAgreementsAsync"/> returns it.</summary>
public sealed record ClickwrapAgreementSummary
{
    /// <summary>The agreement's ID.</summary>
    public string Id { get; init; } = null!;

    /// <summary>The organization that owns the agreement.</summary>
    public string OrganizationId { get; init; } = null!;

    /// <summary>What developers pass to the API, such as "terms-of-service". It never changes.</summary>
    public string Key { get; init; } = null!;

    /// <summary>What admins see, such as "Terms of Service".</summary>
    public string Name { get; init; } = null!;

    /// <summary>The profile that created the agreement, if it still exists.</summary>
    public string? CreatedBy { get; init; }

    /// <summary>When the agreement was created.</summary>
    public DateTimeOffset CreatedAt { get; init; }

    /// <summary>When the agreement was last renamed.</summary>
    public DateTimeOffset UpdatedAt { get; init; }

    /// <summary>The latest published version, or null if nothing has been published.</summary>
    public ClickwrapVersionRef? CurrentVersion { get; init; }

    /// <summary>The open draft, or null if there isn't one. An agreement has at most one.</summary>
    public ClickwrapVersionRef? DraftVersion { get; init; }

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
