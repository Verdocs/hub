using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>An organization: the tenant that profiles, templates, and envelopes belong to.</summary>
public sealed record Organization
{
    /// <summary>The unique ID of the organization.</summary>
    public string Id { get; init; } = null!;

    /// <summary>The organization's name.</summary>
    public string Name { get; init; } = null!;

    /// <summary>Street address.</summary>
    public string? Address { get; init; }

    /// <summary>Street address, second line.</summary>
    public string? Address2 { get; init; }

    /// <summary>Phone number.</summary>
    public string? Phone { get; init; }

    /// <summary>Contact email address for the organization.</summary>
    public string? ContactEmail { get; init; }

    /// <summary>URL-safe short name.</summary>
    public string? Slug { get; init; }

    /// <summary>Web site URL.</summary>
    public string? Url { get; init; }

    /// <summary>URL of the full-size logo.</summary>
    public string? FullLogoUrl { get; init; }

    /// <summary>URL of the thumbnail logo.</summary>
    public string? ThumbnailUrl { get; init; }

    /// <summary>Primary brand color.</summary>
    public string? PrimaryColor { get; init; }

    /// <summary>Secondary brand color.</summary>
    public string? SecondaryColor { get; init; }

    /// <summary>Parent organization ID, for child organizations.</summary>
    public string? ParentId { get; init; }

    /// <summary>CSS style overrides applied to embedded views.</summary>
    public string? StyleOverrides { get; init; }

    /// <summary>True when HIPAA handling applies to the organization. (The wire name preserves a historical typo.)</summary>
    public bool? HipaaComplaint { get; init; }

    /// <summary>Custom signing disclaimer text.</summary>
    public string? Disclaimer { get; init; }

    /// <summary>URL of the organization's terms-of-use page.</summary>
    public string? TermsUseUrl { get; init; }

    /// <summary>URL of the organization's privacy policy page.</summary>
    public string? PrivacyPolicyUrl { get; init; }

    /// <summary>Label shown for the powered-by link in branded views.</summary>
    public string? PoweredByLabel { get; init; }

    /// <summary>URL for the powered-by link in branded views.</summary>
    public string? PoweredByUrl { get; init; }

    /// <summary>Arbitrary storage for integrators, for example source record IDs.</summary>
    public JsonElement? Data { get; init; }

    /// <summary>Org-level document-pipeline automation flags. All flags are opt-in and default to false.</summary>
    public JsonElement? PipelineSettings { get; init; }

    /// <summary>The default brand applied to the organization's envelopes, if any.</summary>
    public string? DefaultBrandId { get; init; }

    /// <summary>The locale code.</summary>
    public string? Locale { get; init; }

    /// <summary>The long-form timezone.</summary>
    public string? Timezone { get; init; }

    /// <summary>If true, the organization may not be deleted. Defaults to true (protected).</summary>
    public bool DeletionProtected { get; init; }

    /// <summary>Creation date and time.</summary>
    public DateTimeOffset CreatedAt { get; init; }

    /// <summary>Last-update date and time.</summary>
    public DateTimeOffset UpdatedAt { get; init; }

    /// <summary>Wire fields this seed model does not cover yet, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
