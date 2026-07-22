using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>Optional locale details recorded with an envelope submission (<see cref="Resources.Recipients.SubmitAsync"/>).</summary>
public sealed record RecipientSubmitBody
{
    /// <summary>The locale code, for example "en-US".</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Locale { get; init; }

    /// <summary>The long-form timezone, for example "America/Phoenix".</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Timezone { get; init; }
}
