using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// Details for <see cref="Resources.Organizations.CreateAsync"/>. The deployed API validates
/// every field here but currently persists only <see cref="Name"/>, <see cref="ParentId"/>,
/// <see cref="Timezone"/>, and <see cref="Locale"/>; the contact email is taken from the
/// caller's profile and the remaining branding fields are dropped. Apply branding with
/// <see cref="Resources.Organizations.UpdateAsync"/> after creation instead.
/// </summary>
public sealed record CreateOrganizationRequest
{
    /// <summary>The name of the new organization.</summary>
    public required string Name { get; init; }

    /// <summary>Creates the organization as a child of this parent. The caller must be a member of the parent.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? ParentId { get; init; }

    /// <summary>Contact email address for the organization.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? ContactEmail { get; init; }

    /// <summary>Web site URL.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Url { get; init; }

    /// <summary>URL of the full-size logo.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? FullLogoUrl { get; init; }

    /// <summary>URL of the thumbnail logo.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? ThumbnailUrl { get; init; }

    /// <summary>Primary brand color, as a hex string.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? PrimaryColor { get; init; }

    /// <summary>Secondary brand color, as a hex string.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? SecondaryColor { get; init; }

    /// <summary>URL of a terms-of-use page shown in the signing experience.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? TermsUseUrl { get; init; }

    /// <summary>URL of a privacy policy page shown in the signing experience.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? PrivacyPolicyUrl { get; init; }

    /// <summary>Label shown for the powered-by link in the signing experience.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? PoweredByLabel { get; init; }

    /// <summary>URL opened by the powered-by label. Rendered as a static label if not set.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? PoweredByUrl { get; init; }

    /// <summary>Custom disclaimer block presented to envelope recipients. Basic HTML is allowed.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Disclaimer { get; init; }

    /// <summary>Arbitrary storage for integrators, for example source record IDs.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public JsonElement? Data { get; init; }

    /// <summary>Prevents the organization from being deleted until turned off. The server defaults to true.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public bool? DeletionProtected { get; init; }

    /// <summary>The long-form timezone.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Timezone { get; init; }

    /// <summary>The locale code.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Locale { get; init; }
}
