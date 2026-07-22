using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// Changes for <see cref="Resources.Brands.UpdateAsync"/>. Only the fields set are sent;
/// fields omitted are left unchanged. The brand key cannot be changed after creation.
/// </summary>
public sealed record UpdateBrandRequest
{
    /// <summary>Display name for the brand.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Name { get; init; }

    /// <summary>URL of the full-size logo. To upload the image itself, use <see cref="Resources.Brands.UpdateLogoAsync"/>.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? FullLogoUrl { get; init; }

    /// <summary>URL of the thumbnail logo. To upload the image itself, use <see cref="Resources.Brands.UpdateThumbnailAsync"/>.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? ThumbnailUrl { get; init; }

    /// <summary>URL of the favicon used on branded pages.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? FaviconUrl { get; init; }

    /// <summary>Browser page title used on branded pages.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? PageTitle { get; init; }

    /// <summary>Primary brand color, as a hex string.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? PrimaryColor { get; init; }

    /// <summary>Secondary brand color, as a hex string.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? SecondaryColor { get; init; }

    /// <summary>Label shown for the powered-by link in branded views.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? PoweredByLabel { get; init; }

    /// <summary>URL for the powered-by link in branded views.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? PoweredByUrl { get; init; }

    /// <summary>CSS style overrides applied to branded views.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? StyleOverrides { get; init; }

    /// <summary>Custom signing disclaimer text.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Disclaimer { get; init; }

    /// <summary>URL of the brand's terms-of-use page.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? TermsUseUrl { get; init; }

    /// <summary>URL of the brand's privacy policy page.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? PrivacyPolicyUrl { get; init; }

    /// <summary>Support contact shown to signers.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? SupportContact { get; init; }

    /// <summary>Reason string embedded in PDF signatures.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? PdfSignatureReason { get; init; }

    /// <summary>Location string embedded in PDF signatures.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? PdfSignatureLocation { get; init; }

    /// <summary>The long-form timezone.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Timezone { get; init; }

    /// <summary>The locale code.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Locale { get; init; }
}
