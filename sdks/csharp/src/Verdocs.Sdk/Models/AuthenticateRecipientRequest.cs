using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// One verification step for <see cref="Resources.Recipients.VerifySignerAsync"/>. The js-sdk
/// models this as four request variants (passcode, email, SMS, and KBA); C# has no union
/// types, so one record covers them all and <see cref="AuthMethod"/> discriminates. Set
/// <see cref="Code"/> for the passcode, email, and SMS methods; the remaining properties feed
/// the KBA method.
/// </summary>
public sealed record AuthenticateRecipientRequest
{
    /// <summary>The authentication method being completed; see <see cref="RecipientAuthMethod"/> for known values.</summary>
    public required string AuthMethod { get; init; }

    /// <summary>The passcode or one-time code entered. Required for the passcode, email, and SMS methods.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Code { get; init; }

    /// <summary>For the SMS and email methods, set true to send a new code instead of verifying one.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public bool? Resend { get; init; }

    /// <summary>For KBA, the recipient's first name.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? FirstName { get; init; }

    /// <summary>For KBA, the recipient's last name.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? LastName { get; init; }

    /// <summary>For KBA, the recipient's street address.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Address { get; init; }

    /// <summary>For KBA, the recipient's city.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? City { get; init; }

    /// <summary>For KBA, the recipient's state.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? State { get; init; }

    /// <summary>For KBA, the recipient's zip code.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Zip { get; init; }

    /// <summary>For KBA, the last four digits of the recipient's SSN.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    [JsonPropertyName("ssn_last_4")]
    public string? SsnLast4 { get; init; }

    /// <summary>For KBA, the recipient's date of birth.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Dob { get; init; }

    /// <summary>For KBA, answers to any challenge questions presented.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyList<KbaResponse>? Responses { get; init; }
}
