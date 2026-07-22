using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>Details for <see cref="Resources.Brands.AddEmailDomainAsync"/>.</summary>
public sealed record AddBrandEmailDomainRequest
{
    /// <summary>The domain branded email is sent from, for example "notify.acme.com".</summary>
    public required string Subdomain { get; init; }

    /// <summary>Local part (before the at sign) of the sender address, for example "notifications".</summary>
    public required string LocalPart { get; init; }

    /// <summary>Display name for the sender address.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? DisplayName { get; init; }

    /// <summary>Reply-to address for branded email.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? ReplyTo { get; init; }
}
