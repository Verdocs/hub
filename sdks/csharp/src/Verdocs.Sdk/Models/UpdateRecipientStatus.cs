using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// A legacy recipient-status update shape. No current operation accepts it; the js-sdk exports
/// it without referencing it, and it is ported for API parity.
/// </summary>
public sealed record UpdateRecipientStatus
{
    /// <summary>New first name for the recipient.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? FirstName { get; init; }

    /// <summary>New last name for the recipient.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? LastName { get; init; }

    /// <summary>Whether the recipient has agreed to the signing disclosures.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public bool? Agreed { get; init; }

    /// <summary>The operation to perform: "prepare" or "update".</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Action { get; init; }
}
