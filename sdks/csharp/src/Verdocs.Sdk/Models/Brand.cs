using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// A white-label branding profile: logos, colors, custom app and email domains, and the
/// legal links applied to envelopes sent under the brand.
/// </summary>
public sealed record Brand
{
    /// <summary>The unique ID of the brand.</summary>
    public string Id { get; init; } = null!;

    /// <summary>The organization the brand belongs to.</summary>
    public string OrganizationId { get; init; } = null!;

    /// <summary>URL-safe key identifying the brand within its organization.</summary>
    public string Key { get; init; } = null!;

    /// <summary>Display name for the brand.</summary>
    public string? Name { get; init; }

    /// <summary>URL of the full-size logo.</summary>
    public string? FullLogoUrl { get; init; }

    /// <summary>URL of the thumbnail logo.</summary>
    public string? ThumbnailUrl { get; init; }

    /// <summary>URL of the favicon used on branded pages.</summary>
    public string? FaviconUrl { get; init; }

    /// <summary>Browser page title used on branded pages.</summary>
    public string? PageTitle { get; init; }

    /// <summary>Primary brand color.</summary>
    public string? PrimaryColor { get; init; }

    /// <summary>Secondary brand color.</summary>
    public string? SecondaryColor { get; init; }

    /// <summary>Label shown for the powered-by link in branded views.</summary>
    public string? PoweredByLabel { get; init; }

    /// <summary>URL for the powered-by link in branded views.</summary>
    public string? PoweredByUrl { get; init; }

    /// <summary>CSS style overrides applied to branded views.</summary>
    public string? StyleOverrides { get; init; }

    /// <summary>Custom signing disclaimer text.</summary>
    public string? Disclaimer { get; init; }

    /// <summary>URL of the brand's terms-of-use page.</summary>
    public string? TermsUseUrl { get; init; }

    /// <summary>URL of the brand's privacy policy page.</summary>
    public string? PrivacyPolicyUrl { get; init; }

    /// <summary>Support contact shown to signers.</summary>
    public string? SupportContact { get; init; }

    /// <summary>Reason string embedded in PDF signatures.</summary>
    public string? PdfSignatureReason { get; init; }

    /// <summary>Location string embedded in PDF signatures.</summary>
    public string? PdfSignatureLocation { get; init; }

    /// <summary>Custom domain the branded app is served from.</summary>
    public string? AppDomain { get; init; }

    /// <summary>Custom app domain status; see <see cref="DomainStatus"/> for known values.</summary>
    public string? AppDomainStatus { get; init; }

    /// <summary>Cloudflare identifier for the custom app domain.</summary>
    public string? AppDomainCfId { get; init; }

    /// <summary>Domain-control validation token for the custom app domain.</summary>
    public string? AppDomainDcvToken { get; init; }

    /// <summary>Custom domain branded email is sent from.</summary>
    public string? EmailDomain { get; init; }

    /// <summary>Local part (before the at sign) of the branded sender address.</summary>
    public string? EmailLocalPart { get; init; }

    /// <summary>Display name of the branded sender address.</summary>
    public string? EmailDisplayName { get; init; }

    /// <summary>Reply-to address for branded email.</summary>
    public string? EmailReplyTo { get; init; }

    /// <summary>True once the reply-to address has been verified.</summary>
    public bool EmailReplyToVerified { get; init; }

    /// <summary>Custom email domain status; see <see cref="Verdocs.Models.EmailDomainStatus"/> for known values.</summary>
    public string? EmailDomainStatus { get; init; }

    /// <summary>True once the email domain's SPF record has been verified.</summary>
    public bool EmailSpfVerified { get; init; }

    /// <summary>True once the email domain's DKIM records have been verified.</summary>
    public bool EmailDkimVerified { get; init; }

    /// <summary>True once the email domain's DMARC record has been verified.</summary>
    public bool EmailDmarcVerified { get; init; }

    /// <summary>DKIM tokens to publish as CNAME records for the email domain.</summary>
    public IReadOnlyList<string> EmailDkimTokens { get; init; } = [];

    /// <summary>The locale code.</summary>
    public string? Locale { get; init; }

    /// <summary>The long-form timezone.</summary>
    public string? Timezone { get; init; }

    /// <summary>Creation date and time.</summary>
    public DateTimeOffset CreatedAt { get; init; }

    /// <summary>Last-update date and time.</summary>
    public DateTimeOffset UpdatedAt { get; init; }

    /// <summary>The owning organization, when the API includes it.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public Organization? Organization { get; init; }

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
