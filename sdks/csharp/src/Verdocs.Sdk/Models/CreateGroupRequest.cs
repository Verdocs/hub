namespace Verdocs.Models;

/// <summary>Details for <see cref="Resources.Groups.CreateAsync"/>. "everyone" is a reserved name.</summary>
public sealed record CreateGroupRequest
{
    /// <summary>Display name for the group. The server lowercases it.</summary>
    public required string Name { get; init; }

    /// <summary>Permissions granted to the group's members.</summary>
    public required IReadOnlyList<string> Permissions { get; init; }
}
