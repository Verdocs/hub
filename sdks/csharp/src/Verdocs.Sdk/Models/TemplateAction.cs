namespace Verdocs.Models;

/// <summary>
/// Actions a caller may attempt on a template, used by permission checks. Properties stay
/// typed as string so an unknown future value never breaks deserialization.
/// </summary>
public static class TemplateAction
{
    /// <summary>Create a personal (private) template.</summary>
    public const string CreatePersonal = "create_personal";

    /// <summary>Create a template shared with the organization.</summary>
    public const string CreateOrg = "create_org";

    /// <summary>Create a public template.</summary>
    public const string CreatePublic = "create_public";

    /// <summary>View the template.</summary>
    public const string Read = "read";

    /// <summary>Modify the template.</summary>
    public const string Write = "write";

    /// <summary>Delete the template.</summary>
    public const string Delete = "delete";

    /// <summary>Make the template private.</summary>
    public const string ChangeVisibilityPersonal = "change_visibility_personal";

    /// <summary>Share the template with the organization.</summary>
    public const string ChangeVisibilityOrg = "change_visibility_org";

    /// <summary>Make the template public.</summary>
    public const string ChangeVisibilityPublic = "change_visibility_public";
}
