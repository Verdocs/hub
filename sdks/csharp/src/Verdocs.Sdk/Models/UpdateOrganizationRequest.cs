using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// Changes for <see cref="Resources.Organizations.UpdateAsync"/>. Only the fields set are
/// sent; the server rejects unknown keys, so this record carries exactly the fields its
/// update schema accepts. Fields omitted are left unchanged.
/// </summary>
public sealed record UpdateOrganizationRequest
{
    /// <summary>The organization's name.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Name { get; init; }

    /// <summary>Street address.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Address { get; init; }

    /// <summary>Street address, second line.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Address2 { get; init; }

    /// <summary>Phone number.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Phone { get; init; }

    /// <summary>Contact email address for the organization.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? ContactEmail { get; init; }

    /// <summary>Web site URL.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Url { get; init; }

    /// <summary>URL of the full-size logo. To upload the image itself, use <see cref="Resources.Organizations.UpdateLogoAsync"/>.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? FullLogoUrl { get; init; }

    /// <summary>URL of the thumbnail logo. To upload the image itself, use <see cref="Resources.Organizations.UpdateThumbnailAsync"/>.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? ThumbnailUrl { get; init; }

    /// <summary>Primary brand color, as a hex string.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? PrimaryColor { get; init; }

    /// <summary>Secondary brand color, as a hex string.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? SecondaryColor { get; init; }

    /// <summary>Custom disclaimer block presented to envelope recipients. Basic HTML is allowed.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Disclaimer { get; init; }

    /// <summary>URL of a terms-of-use page shown in the signing experience.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? TermsUseUrl { get; init; }

    /// <summary>URL of a privacy policy page shown in the signing experience.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? PrivacyPolicyUrl { get; init; }

    /// <summary>URL opened by the powered-by label.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? PoweredByUrl { get; init; }

    /// <summary>Label shown for the powered-by link in the signing experience.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? PoweredByLabel { get; init; }

    /// <summary>Arbitrary storage for integrators, for example source record IDs.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public JsonElement? Data { get; init; }

    /// <summary>CSS style overrides applied to embedded views.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? StyleOverrides { get; init; }

    /// <summary>The default brand applied to the organization's envelopes.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? DefaultBrandId { get; init; }

    /// <summary>Prevents the organization from being deleted until turned off.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public bool? DeletionProtected { get; init; }

    /// <summary>The long-form timezone.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Timezone { get; init; }

    /// <summary>The locale code.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Locale { get; init; }
}
