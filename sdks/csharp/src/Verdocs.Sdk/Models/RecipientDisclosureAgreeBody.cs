using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>Optional locale details recorded with a disclosure agreement (<see cref="Resources.Recipients.AgreeAsync"/>).</summary>
public sealed record RecipientDisclosureAgreeBody
{
    /// <summary>The locale code, for example "en-US".</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Locale { get; init; }

    /// <summary>The long-form timezone, for example "America/Phoenix".</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Timezone { get; init; }
}
