using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>One agreement version in a headless outcome.</summary>
public sealed record ClickwrapOutcomeAgreement
{
    /// <summary>The agreement's key.</summary>
    public required string Key { get; init; }

    /// <summary>The version the person saw. It must be published.</summary>
    public required string VersionId { get; init; }
}
