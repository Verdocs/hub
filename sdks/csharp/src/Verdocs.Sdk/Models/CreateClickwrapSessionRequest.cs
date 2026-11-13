using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>The fields for <see cref="Resources.Clickwrap.CreateSessionAsync"/>.</summary>
public sealed record CreateClickwrapSessionRequest
{
    /// <summary>The person's ID in your own system.</summary>
    public required string UserId { get; init; }

    /// <summary>The agreement keys to check, in the order to show them. Up to 20.</summary>
    public required IReadOnlyList<string> Agreements { get; init; }

    /// <summary>Flat string values to keep with the record, such as an email. Up to 50 keys.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyDictionary<string, string>? Metadata { get; init; }

    /// <summary>How the component shows the terms; see <see cref="ClickwrapMode"/>. Defaults to modal.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Mode { get; init; }

    /// <summary>Whether the person must scroll to the end before accepting. Defaults to false.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public bool? RequireScroll { get; init; }

    /// <summary>The brand to theme the component and hosted page with.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? BrandKey { get; init; }

    /// <summary>Where the hosted page sends the person after they accept. https, or http on localhost.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? ReturnUrl { get; init; }

    /// <summary>Where the hosted page sends the person if they decline or cancel.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? CancelUrl { get; init; }
}
