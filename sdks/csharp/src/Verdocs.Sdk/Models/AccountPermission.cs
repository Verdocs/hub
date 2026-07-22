namespace Verdocs.Models;

/// <summary>
/// Account and membership permissions a profile or group may hold, from the js-sdk's
/// TAccountPermission union (Sessions/Permissions.ts). Permission lists stay typed as string
/// so an unknown future value never breaks deserialization; compare against these constants.
/// </summary>
public static class AccountPermission
{
    /// <summary>Grant the "owner" role to other organization members.</summary>
    public const string OwnerAdd = "owner:add";

    /// <summary>Remove the "owner" role from other organization members.</summary>
    public const string OwnerRemove = "owner:remove";

    /// <summary>Grant the "admin" role to other organization members.</summary>
    public const string AdminAdd = "admin:add";

    /// <summary>Remove the "admin" role from other organization members.</summary>
    public const string AdminRemove = "admin:remove";

    /// <summary>View the members of an organization.</summary>
    public const string MemberView = "member:view";

    /// <summary>Grant the "member" role to other organization members.</summary>
    public const string MemberAdd = "member:add";

    /// <summary>Remove the "member" role from other organization members.</summary>
    public const string MemberRemove = "member:remove";
}
