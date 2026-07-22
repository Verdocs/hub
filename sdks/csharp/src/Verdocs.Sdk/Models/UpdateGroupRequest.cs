namespace Verdocs.Models;

/// <summary>
/// Replacement values for <see cref="Resources.Groups.UpdateAsync"/>. The server requires
/// both fields on every update; the "everyone" group cannot be renamed.
/// </summary>
public sealed record UpdateGroupRequest
{
    /// <summary>Display name for the group. The server lowercases it.</summary>
    public required string Name { get; init; }

    /// <summary>Permissions granted to the group's members. This replaces the whole list.</summary>
    public required IReadOnlyList<string> Permissions { get; init; }
}
