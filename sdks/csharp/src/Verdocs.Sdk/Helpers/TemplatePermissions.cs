using Verdocs.Models;

namespace Verdocs.Helpers;

/// <summary>
/// Pure helpers that identify the operations available on a template to a profile, ported
/// from the js-sdk's Templates/Permissions.ts and Templates/Actions.ts. All checks run
/// locally on data already fetched; nothing here calls the API, and the server remains the
/// authority on what a caller may actually do.
/// </summary>
public static class TemplatePermissions
{
    /// <summary>
    /// True when the user created the template. Ports the js-sdk's userIsTemplateCreator.
    /// </summary>
    /// <param name="profile">The profile to check, or null for no session.</param>
    /// <param name="template">The template to check against, or null.</param>
    /// <returns>True when the profile matches the template's creator.</returns>
    public static bool UserIsTemplateCreator(Profile? profile, Template? template) =>
        profile != null && template != null && profile.Id == template.ProfileId;

    /// <summary>
    /// True when the template is shared with the user: it is not personal and belongs to the
    /// user's organization. Ports the js-sdk's userHasSharedTemplate.
    /// </summary>
    /// <param name="profile">The profile to check, or null for no session.</param>
    /// <param name="template">The template to check against, or null.</param>
    /// <returns>True when the template is shared with the profile's organization.</returns>
    public static bool UserHasSharedTemplate(Profile? profile, Template? template) =>
        profile != null && template != null && !template.IsPersonal &&
        profile.OrganizationId == template.OrganizationId;

    /// <summary>
    /// True when the user can create a personal (private) template. Ports the js-sdk's
    /// userCanCreatePersonalTemplate.
    /// </summary>
    /// <param name="profile">The profile to check, or null for no session.</param>
    /// <returns>True when the user holds the personal-create permission.</returns>
    public static bool UserCanCreatePersonalTemplate(Profile? profile) =>
        SessionPermissions.UserHasPermissions(profile, [TemplatePermission.CreatePersonal]);

    /// <summary>
    /// True when the user can create an org-shared template. Ports the js-sdk's
    /// userCanCreateOrgTemplate.
    /// </summary>
    /// <param name="profile">The profile to check, or null for no session.</param>
    /// <returns>True when the user holds the org-create permission.</returns>
    public static bool UserCanCreateOrgTemplate(Profile? profile) =>
        SessionPermissions.UserHasPermissions(profile, [TemplatePermission.CreateOrg]);

    /// <summary>
    /// True when the user can create a public template. Ports the js-sdk's
    /// userCanCreatePublicTemplate.
    /// </summary>
    /// <param name="profile">The profile to check, or null for no session.</param>
    /// <returns>True when the user holds the public-create permission.</returns>
    public static bool UserCanCreatePublicTemplate(Profile? profile) =>
        SessionPermissions.UserHasPermissions(profile, [TemplatePermission.CreatePublic]);

    /// <summary>
    /// True when the user can read/view the template. Ports the js-sdk's userCanReadTemplate.
    /// </summary>
    /// <param name="profile">The profile to check, or null for no session.</param>
    /// <param name="template">The template to check against.</param>
    /// <returns>True when the user may view the template.</returns>
    public static bool UserCanReadTemplate(Profile? profile, Template template) =>
        template.IsPublic ||
        UserIsTemplateCreator(profile, template) ||
        (UserHasSharedTemplate(profile, template) &&
         SessionPermissions.UserHasPermissions(profile, [TemplatePermission.MemberRead]));

    /// <summary>
    /// True when the user can update the template. Ports the js-sdk's userCanUpdateTemplate.
    /// </summary>
    /// <param name="profile">The profile to check, or null for no session.</param>
    /// <param name="template">The template to check against.</param>
    /// <returns>True when the user may modify the template.</returns>
    public static bool UserCanUpdateTemplate(Profile? profile, Template template) =>
        UserIsTemplateCreator(profile, template) ||
        (UserHasSharedTemplate(profile, template) &&
         SessionPermissions.UserHasPermissions(
             profile, [TemplatePermission.MemberRead, TemplatePermission.MemberWrite]));

    /// <summary>
    /// True when the user can make the template personal (private). Ports the js-sdk's
    /// userCanMakeTemplatePrivate.
    /// </summary>
    /// <param name="profile">The profile to check, or null for no session.</param>
    /// <param name="template">The template to check against.</param>
    /// <returns>True when the user may change the template's visibility to private.</returns>
    public static bool UserCanMakeTemplatePrivate(Profile? profile, Template template) =>
        UserIsTemplateCreator(profile, template)
            ? SessionPermissions.UserHasPermissions(profile, [TemplatePermission.CreatePersonal])
            : SessionPermissions.UserHasPermissions(profile, [TemplatePermission.MemberVisibility]);

    /// <summary>
    /// True when the user can make the template org-shared. Ports the js-sdk's
    /// userCanMakeTemplateShared.
    /// </summary>
    /// <param name="profile">The profile to check, or null for no session.</param>
    /// <param name="template">The template to check against.</param>
    /// <returns>True when the user may change the template's visibility to shared.</returns>
    public static bool UserCanMakeTemplateShared(Profile? profile, Template template) =>
        UserIsTemplateCreator(profile, template)
            ? SessionPermissions.UserHasPermissions(profile, [TemplatePermission.CreateOrg])
            : SessionPermissions.UserHasPermissions(profile, [TemplatePermission.MemberVisibility]);

    /// <summary>
    /// True when the user can make the template public. Ports the js-sdk's
    /// userCanMakeTemplatePublic.
    /// </summary>
    /// <param name="profile">The profile to check, or null for no session.</param>
    /// <param name="template">The template to check against.</param>
    /// <returns>True when the user may change the template's visibility to public.</returns>
    public static bool UserCanMakeTemplatePublic(Profile? profile, Template template) =>
        UserIsTemplateCreator(profile, template)
            ? SessionPermissions.UserHasPermissions(profile, [TemplatePermission.CreatePublic])
            : SessionPermissions.UserHasPermissions(profile, [TemplatePermission.MemberVisibility]);

    /// <summary>
    /// True when the user, as the template's creator, can change whether it is personal vs
    /// org-shared. Ports the js-sdk's userCanChangeOrgVisibility.
    /// </summary>
    /// <param name="profile">The profile to check, or null for no session.</param>
    /// <param name="template">The template to check against.</param>
    /// <returns>True when the user may change the template's organization visibility.</returns>
    public static bool UserCanChangeOrgVisibility(Profile? profile, Template template) =>
        UserIsTemplateCreator(profile, template) &&
        SessionPermissions.UserHasPermissions(profile, [TemplatePermission.CreatePersonal]);

    /// <summary>
    /// True when the user can delete the template. Ports the js-sdk's userCanDeleteTemplate.
    /// </summary>
    /// <param name="profile">The profile to check, or null for no session.</param>
    /// <param name="template">The template to check against.</param>
    /// <returns>True when the user may delete the template.</returns>
    public static bool UserCanDeleteTemplate(Profile? profile, Template template) =>
        UserIsTemplateCreator(profile, template)
            ? SessionPermissions.UserHasPermissions(profile, [TemplatePermission.Delete])
            : SessionPermissions.UserHasPermissions(profile, [TemplatePermission.MemberDelete]);

    /// <summary>
    /// True when the user can create an envelope from the template. Ports the js-sdk's
    /// userCanSendTemplate. Private templates are sendable by their creator, shared templates
    /// by anyone in the owning organization, and public templates by anyone; a template whose
    /// visibility is missing or unrecognized is never sendable (the js-sdk's tail checks on
    /// roles and fields can only return a falsy result, and that is kept for parity).
    /// </summary>
    /// <param name="profile">The profile to check, or null for no session.</param>
    /// <param name="template">The template to check against.</param>
    /// <returns>True when the user may send the template.</returns>
    public static bool UserCanSendTemplate(Profile? profile, Template template)
    {
        switch (template.Visibility)
        {
            case TemplateVisibility.Private:
                return UserIsTemplateCreator(profile, template);

            case TemplateVisibility.Shared:
                return UserIsTemplateCreator(profile, template) ||
                       template.OrganizationId == profile?.OrganizationId;

            case TemplateVisibility.Public:
                return true;
        }

        // The js-sdk only reaches these checks for unrecognized visibility values, and every
        // path through them is falsy (it falls off the end, returning undefined). Kept, with
        // the implicit undefined normalized to false.
        if (template.Roles == null || template.Roles.Count == 0)
        {
            return false;
        }

        if (template.Fields == null || template.Fields.Count == 0)
        {
            return false;
        }

        return false;
    }

    /// <summary>
    /// True when the user can create a new template of any visibility. Ports the js-sdk's
    /// userCanCreateTemplate.
    /// </summary>
    /// <param name="profile">The profile to check, or null for no session.</param>
    /// <returns>True when the user holds any of the template-create permissions.</returns>
    public static bool UserCanCreateTemplate(Profile? profile) =>
        UserCanCreatePersonalTemplate(profile) ||
        UserCanCreateOrgTemplate(profile) ||
        UserCanCreatePublicTemplate(profile);

    /// <summary>
    /// True when the user can "build" the template (use the field builder): the user must
    /// have write access and the template must have at least one signer role. Ports the
    /// js-sdk's userCanBuildTemplate.
    /// </summary>
    /// <param name="profile">The profile to check, or null for no session.</param>
    /// <param name="template">The template to check against.</param>
    /// <returns>True when the user may open the template in the builder.</returns>
    public static bool UserCanBuildTemplate(Profile? profile, Template template) =>
        UserCanUpdateTemplate(profile, template) &&
        (template.Roles ?? []).Any(role => role.Type == RecipientType.Signer);

    /// <summary>
    /// The template's fields assigned to the named role. Ports the js-sdk's getFieldsForRole.
    /// </summary>
    /// <param name="template">The template to scan.</param>
    /// <param name="roleName">The role name to filter by.</param>
    /// <returns>The fields assigned to the role.</returns>
    public static IReadOnlyList<TemplateField> GetFieldsForRole(Template template, string roleName) =>
        (template.Fields ?? []).Where(field => field.RoleName == roleName).ToList();

    /// <summary>
    /// True when the user can preview the template: the user must have read access, the
    /// template must have at least one signer, and every signer must have at least one field.
    /// Ports the js-sdk's userCanPreviewTemplate.
    /// </summary>
    /// <param name="profile">The profile to check, or null for no session.</param>
    /// <param name="template">The template to check against.</param>
    /// <returns>True when the user may preview the template.</returns>
    public static bool UserCanPreviewTemplate(Profile? profile, Template template)
    {
        var hasPermission = UserCanReadTemplate(profile, template);
        var signers = (template.Roles ?? []).Where(role => role.Type == RecipientType.Signer).ToList();
        return hasPermission && signers.Count > 0 &&
               signers.All(signer => GetFieldsForRole(template, signer.Name).Count > 0);
    }

    /// <summary>
    /// Whether the user can perform the given action on a template, with a message explaining
    /// any denial. Ports the js-sdk's canPerformTemplateAction (Templates/Actions.ts). The
    /// template may be omitted only for the create actions. Note this checks the profile's
    /// directly assigned permissions only (via <see cref="HasRequiredPermissions"/>), not
    /// role- or group-conferred ones, matching the js-sdk.
    /// </summary>
    /// <param name="profile">The profile to check, or null for no session.</param>
    /// <param name="action">The action to test; see <see cref="TemplateAction"/> for known values.</param>
    /// <param name="template">The template to act on, required for everything except the create actions.</param>
    /// <returns>CanPerform, plus a Message explaining the denial (empty when allowed).</returns>
    public static (bool CanPerform, string Message) CanPerformTemplateAction(
        Profile? profile, string action, Template? template = null)
    {
        if (template == null && !action.Contains("create", StringComparison.Ordinal))
        {
            return (false, "Missing required template object");
        }

        // We use BOGUS here to force comparisons like template?.ProfileId == profileId to NOT
        // match when both sides are missing; two absent values would otherwise compare equal.
        var profileId = profile?.Id is { Length: > 0 } id ? id : "BOGUS";
        var organizationId = profile?.OrganizationId is { Length: > 0 } orgId ? orgId : "BOGUS";

        if (string.IsNullOrEmpty(profileId))
        {
            // Unreachable because profileId always defaults to BOGUS above; the js-sdk carries
            // the same dead check and it is kept for parity.
            return (false, "Active session required");
        }

        var isCreator = template?.ProfileId == profileId;
        var isSameOrg = template?.OrganizationId == organizationId;
        var isPersonal = template?.IsPersonal ?? false;
        var isPublic = template?.IsPublic ?? false;

        var permissionsRequired = new List<string>();
        switch (action)
        {
            case TemplateAction.CreatePersonal:
                permissionsRequired.Add(TemplatePermission.CreatePersonal);
                break;
            case TemplateAction.CreateOrg:
                permissionsRequired.Add(TemplatePermission.CreateOrg);
                break;
            case TemplateAction.CreatePublic:
                permissionsRequired.Add(TemplatePermission.CreatePublic);
                break;
            case TemplateAction.Read:
                if (!isCreator && ((!isPersonal && isSameOrg) || !isPublic))
                {
                    permissionsRequired.Add(TemplatePermission.MemberRead);
                }

                break;
            case TemplateAction.Write:
                if (!isCreator)
                {
                    permissionsRequired.Add(TemplatePermission.MemberRead);
                    permissionsRequired.Add(TemplatePermission.MemberWrite);
                }

                break;
            case TemplateAction.ChangeVisibilityPersonal:
                permissionsRequired.Add(
                    isCreator ? TemplatePermission.CreatePersonal : TemplatePermission.MemberVisibility);
                break;
            case TemplateAction.ChangeVisibilityOrg:
                permissionsRequired.Add(
                    isCreator ? TemplatePermission.CreateOrg : TemplatePermission.MemberVisibility);
                break;
            case TemplateAction.ChangeVisibilityPublic:
                if (isCreator)
                {
                    permissionsRequired.Add(TemplatePermission.CreatePublic);
                    permissionsRequired.Add(TemplatePermission.Visibility);
                }
                else
                {
                    permissionsRequired.Add(TemplatePermission.MemberVisibility);
                }

                break;
            case TemplateAction.Delete:
                permissionsRequired.Add(
                    isCreator ? TemplatePermission.Delete : TemplatePermission.MemberDelete);
                break;
            default:
                return (false, "Action is not defined");
        }

        if (HasRequiredPermissions(profile, permissionsRequired))
        {
            return (true, string.Empty);
        }

        return (false,
            $"Insufficient access to perform '{action}'. Needed permissions: {string.Join(",", permissionsRequired)}");
    }

    /// <summary>
    /// True when the profile's directly assigned permissions include every one of the
    /// specified permissions. Ports the js-sdk's hasRequiredPermissions (Templates/Actions.ts).
    /// Unlike <see cref="SessionPermissions.UserHasPermissions"/>, this ignores role- and
    /// group-conferred permissions, matching the js-sdk. An empty permission list always passes.
    /// </summary>
    /// <param name="profile">The profile to check, or null for no session.</param>
    /// <param name="permissions">The permissions that must all be present.</param>
    /// <returns>True when every requested permission is directly held.</returns>
    public static bool HasRequiredPermissions(Profile? profile, IEnumerable<string> permissions) =>
        permissions.All(perm => (profile?.Permissions ?? []).Contains(perm));
}
