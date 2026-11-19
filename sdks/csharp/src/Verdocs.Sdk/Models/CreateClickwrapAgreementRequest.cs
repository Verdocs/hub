using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>The fields for <see cref="Resources.Clickwrap.CreateAgreementAsync"/>.</summary>
public sealed record CreateClickwrapAgreementRequest
{
    /// <summary>Unique in the organization: lowercase letters and digits separated by single hyphens. It can never change.</summary>
    public required string Key { get; init; }

    /// <summary>What admins see, such as "Terms of Service".</summary>
    public required string Name { get; init; }
}
