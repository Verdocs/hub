namespace Verdocs.Models;

/// <summary>
/// Template permissions a profile or group may hold, from the js-sdk's TTemplatePermission
/// union (Sessions/Permissions.ts). Permission lists stay typed as string so an unknown
/// future value never breaks deserialization; compare against these constants.
/// </summary>
public static class TemplatePermission
{
    /// <summary>Create public templates. Public templates are still owned and managed by the creator, but may be searched for and used to create envelopes by other users.</summary>
    public const string CreatePublic = "template:creator:create:public";

    /// <summary>Create templates shared with other users of the same organization.</summary>
    public const string CreateOrg = "template:creator:create:org";

    /// <summary>Create templates private to the creator.</summary>
    public const string CreatePersonal = "template:creator:create:personal";

    /// <summary>Delete templates the caller created.</summary>
    public const string Delete = "template:creator:delete";

    /// <summary>Alter the visibility settings on templates the caller created.</summary>
    public const string Visibility = "template:creator:visibility";

    /// <summary>View templates shared by other members of the same organization. Those templates must also have is_personal set to false to be visible.</summary>
    public const string MemberRead = "template:member:read";

    /// <summary>Edit templates shared by other members of the same organization. Those templates must also have is_personal set to false to be editable.</summary>
    public const string MemberWrite = "template:member:write";

    /// <summary>Delete templates shared by other members of the same organization.</summary>
    public const string MemberDelete = "template:member:delete";

    /// <summary>Alter the visibility settings on templates shared by other members of the same organization.</summary>
    public const string MemberVisibility = "template:member:visibility";
}
