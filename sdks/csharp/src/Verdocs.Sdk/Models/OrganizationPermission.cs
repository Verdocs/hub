namespace Verdocs.Models;

/// <summary>
/// Organization-level permissions a profile or group may hold, from the js-sdk's
/// TOrgPermission union (Sessions/Permissions.ts). Permission lists stay typed as string so
/// an unknown future value never breaks deserialization; compare against these constants.
/// </summary>
public static class OrganizationPermission
{
    /// <summary>Create a new organization. Deprecated: this is a system-wide setting and organization owners cannot prevent their members from creating other organizations.</summary>
    public const string Create = "org:create";

    /// <summary>View the organization.</summary>
    public const string View = "org:view";

    /// <summary>Update the organization.</summary>
    public const string Update = "org:update";

    /// <summary>Delete the organization.</summary>
    public const string Delete = "org:delete";

    /// <summary>Transfer ownership of the organization. Primarily lets the holder remove their own Owner role or add new Owners even when they are not one themselves, intended for reseller scenarios.</summary>
    public const string Transfer = "org:transfer";

    /// <summary>List organizations. Deprecated: this is a system-wide setting and organization owners cannot prevent their members from listing other organizations they may have separate profiles in.</summary>
    public const string List = "org:list";
}
