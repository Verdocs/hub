using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>An agreement with every version, newest first, as <see cref="Resources.Clickwrap.GetAgreementAsync"/> returns it.</summary>
public sealed record ClickwrapAgreementDetail
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

    /// <summary>Every version, newest first, with its full text.</summary>
    public IReadOnlyList<ClickwrapVersion> Versions { get; init; } = [];

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
