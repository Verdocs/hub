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
    public PipelineSettings? PipelineSettings { get; init; }

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

    /// <summary>
    /// The API key created automatically when a child organization is created, present only on
    /// that response. Deprecated in the js-sdk: API v3 moves it to the top level.
    /// </summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public OrganizationApiKey? ApiKey { get; init; }

    /// <summary>The organization's API keys, when the API includes them.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyList<ApiKey>? ApiKeys { get; init; }

    /// <summary>Branding profiles, when the API includes them.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyList<Brand>? Brands { get; init; }

    /// <summary>Child organizations, when the API includes them.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyList<Organization>? Children { get; init; }

    /// <summary>The parent organization, when the API includes it.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public Organization? Parent { get; init; }

    /// <summary>Permission groups, when the API includes them.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyList<Group>? Groups { get; init; }

    /// <summary>Registered OAuth2 applications, when the API includes them.</summary>
    [JsonPropertyName("oauth2_apps")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyList<OAuth2App>? OAuth2Apps { get; init; }

    /// <summary>Feature entitlements, when the API includes them.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyList<Entitlement>? Entitlements { get; init; }

    /// <summary>Pending membership invitations, when the API includes them.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyList<OrganizationInvitation>? OrganizationInvitations { get; init; }

    /// <summary>Member profiles, when the API includes them.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyList<Profile>? Profiles { get; init; }

    /// <summary>Webhook subscriptions, when the API includes them.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyList<Webhook>? Webhooks { get; init; }

    /// <summary>Envelopes, when the API includes them.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyList<Envelope>? Envelopes { get; init; }

    /// <summary>Templates, when the API includes them.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyList<Template>? Templates { get; init; }

    /// <summary>Group memberships, when the API includes them.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyList<GroupProfile>? GroupProfiles { get; init; }

    /// <summary>Queued or attempted webhook deliveries, when the API includes them.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyList<PendingWebhook>? PendingWebhooks { get; init; }

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
