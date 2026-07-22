namespace Verdocs.Models;

/// <summary>
/// Known values for <see cref="Profile.Roles"/>, from the js-sdk's TRole
/// (Sessions/Permissions.ts). Named ProfileRole because <see cref="Role"/> is the template
/// participant placeholder; this type is the user role that confers the permission sets in
/// <see cref="Helpers.SessionPermissions.RolePermissions"/>. Role lists stay typed as string
/// so an unknown future value never breaks deserialization; compare against these constants.
/// </summary>
public static class ProfileRole
{
    /// <summary>A contact with no organization membership beyond basic visibility.</summary>
    public const string Contact = "contact";

    /// <summary>A user with read-only access to shared resources.</summary>
    public const string BasicUser = "basic_user";

    /// <summary>A regular organization member.</summary>
    public const string Member = "member";

    /// <summary>An organization administrator.</summary>
    public const string Admin = "admin";

    /// <summary>An organization owner.</summary>
    public const string Owner = "owner";
}
