using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// Identity details for the legacy KBA identity submission
/// (<see cref="Resources.Kba.SubmitIdentityAsync"/>). Unlike the rest of the API surface these
/// keys are camelCase on the wire; the route was never deployed, so the js-sdk payload is the
/// only contract there is and we match it exactly.
/// </summary>
public sealed record KbaIdentity
{
    /// <summary>The recipient's first name.</summary>
    [JsonPropertyName("firstName")]
    public required string FirstName { get; init; }

    /// <summary>The recipient's last name.</summary>
    [JsonPropertyName("lastName")]
    public required string LastName { get; init; }

    /// <summary>The recipient's street address.</summary>
    public required string Address { get; init; }

    /// <summary>The recipient's city.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? City { get; init; }

    /// <summary>The recipient's state.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? State { get; init; }

    /// <summary>The recipient's zip code.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Zip { get; init; }

    /// <summary>The last four digits of the recipient's SSN.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    [JsonPropertyName("ssnLast4")]
    public string? SsnLast4 { get; init; }

    /// <summary>The recipient's email address.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Email { get; init; }
}
