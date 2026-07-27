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
    ///
    /// <example>
    /// <code>
    /// if (TemplatePermissions.UserIsTemplateCreator(profile, template))
    /// {
    ///     // ...
    /// }
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="profile">The profile to check, or null for no session.</param>
    /// <param name="template">The template to check against, or null.</param>
    /// <returns>True when the profile matches the template's creator.</returns>
    /// <sdkOperation>template.userIsTemplateCreator</sdkOperation>
    /// <sdkGroup>Template</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
    public static bool UserIsTemplateCreator(Profile? profile, Template? template) =>
        profile != null && template != null && profile.Id == template.ProfileId;

    /// <summary>
    /// True when the template is shared with the user: it is not personal and belongs to the
    /// user's organization. Ports the js-sdk's userHasSharedTemplate.
    ///
    /// <example>
    /// <code>
    /// if (TemplatePermissions.UserHasSharedTemplate(profile, template))
    /// {
    ///     // ...
    /// }
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="profile">The profile to check, or null for no session.</param>
    /// <param name="template">The template to check against, or null.</param>
    /// <returns>True when the template is shared with the profile's organization.</returns>
    /// <sdkOperation>template.userHasSharedTemplate</sdkOperation>
    /// <sdkGroup>Template</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
    public static bool UserHasSharedTemplate(Profile? profile, Template? template) =>
        profile != null && template != null && !template.IsPersonal &&
        profile.OrganizationId == template.OrganizationId;

    /// <summary>
    /// True when the user can create a personal (private) template. Ports the js-sdk's
    /// userCanCreatePersonalTemplate.
    ///
    /// <example>
    /// <code>
    /// if (TemplatePermissions.UserCanCreatePersonalTemplate(profile))
    /// {
    ///     // ...
    /// }
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="profile">The profile to check, or null for no session.</param>
    /// <returns>True when the user holds the personal-create permission.</returns>
    /// <sdkOperation>template.userCanCreatePersonalTemplate</sdkOperation>
    /// <sdkGroup>Template</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
    public static bool UserCanCreatePersonalTemplate(Profile? profile) =>
        SessionPermissions.UserHasPermissions(profile, [TemplatePermission.CreatePersonal]);

    /// <summary>
    /// True when the user can create an org-shared template. Ports the js-sdk's
    /// userCanCreateOrgTemplate.
    ///
    /// <example>
    /// <code>
    /// if (TemplatePermissions.UserCanCreateOrgTemplate(profile))
    /// {
    ///     // ...
    /// }
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="profile">The profile to check, or null for no session.</param>
    /// <returns>True when the user holds the org-create permission.</returns>
    /// <sdkOperation>template.userCanCreateOrgTemplate</sdkOperation>
    /// <sdkGroup>Template</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
    public static bool UserCanCreateOrgTemplate(Profile? profile) =>
        SessionPermissions.UserHasPermissions(profile, [TemplatePermission.CreateOrg]);

    /// <summary>
    /// True when the user can create a public template. Ports the js-sdk's
    /// userCanCreatePublicTemplate.
    ///
    /// <example>
    /// <code>
    /// if (TemplatePermissions.UserCanCreatePublicTemplate(profile))
    /// {
    ///     // ...
    /// }
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="profile">The profile to check, or null for no session.</param>
    /// <returns>True when the user holds the public-create permission.</returns>
    /// <sdkOperation>template.userCanCreatePublicTemplate</sdkOperation>
    /// <sdkGroup>Template</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
    public static bool UserCanCreatePublicTemplate(Profile? profile) =>
        SessionPermissions.UserHasPermissions(profile, [TemplatePermission.CreatePublic]);

    /// <summary>
    /// True when the user can read/view the template. Ports the js-sdk's userCanReadTemplate.
    ///
    /// <example>
    /// <code>
    /// if (TemplatePermissions.UserCanReadTemplate(profile, template))
    /// {
    ///     // ...
    /// }
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="profile">The profile to check, or null for no session.</param>
    /// <param name="template">The template to check against.</param>
    /// <returns>True when the user may view the template.</returns>
    /// <sdkOperation>template.userCanReadTemplate</sdkOperation>
    /// <sdkGroup>Template</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
    public static bool UserCanReadTemplate(Profile? profile, Template template) =>
        template.IsPublic ||
        UserIsTemplateCreator(profile, template) ||
        (UserHasSharedTemplate(profile, template) &&
         SessionPermissions.UserHasPermissions(profile, [TemplatePermission.MemberRead]));

    /// <summary>
    /// True when the user can update the template. Ports the js-sdk's userCanUpdateTemplate.
    ///
    /// <example>
    /// <code>
    /// if (TemplatePermissions.UserCanUpdateTemplate(profile, template))
    /// {
    ///     // ...
    /// }
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="profile">The profile to check, or null for no session.</param>
    /// <param name="template">The template to check against.</param>
    /// <returns>True when the user may modify the template.</returns>
    /// <sdkOperation>template.userCanUpdateTemplate</sdkOperation>
    /// <sdkGroup>Template</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
    public static bool UserCanUpdateTemplate(Profile? profile, Template template) =>
        UserIsTemplateCreator(profile, template) ||
        (UserHasSharedTemplate(profile, template) &&
         SessionPermissions.UserHasPermissions(
             profile, [TemplatePermission.MemberRead, TemplatePermission.MemberWrite]));

    /// <summary>
    /// True when the user can make the template personal (private). Ports the js-sdk's
    /// userCanMakeTemplatePrivate.
    ///
    /// <example>
    /// <code>
    /// if (TemplatePermissions.UserCanMakeTemplatePrivate(profile, template))
    /// {
    ///     // ...
    /// }
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="profile">The profile to check, or null for no session.</param>
    /// <param name="template">The template to check against.</param>
    /// <returns>True when the user may change the template's visibility to private.</returns>
    /// <sdkOperation>template.userCanMakeTemplatePrivate</sdkOperation>
    /// <sdkGroup>Template</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
    public static bool UserCanMakeTemplatePrivate(Profile? profile, Template template) =>
        UserIsTemplateCreator(profile, template)
            ? SessionPermissions.UserHasPermissions(profile, [TemplatePermission.CreatePersonal])
            : SessionPermissions.UserHasPermissions(profile, [TemplatePermission.MemberVisibility]);

    /// <summary>
    /// True when the user can make the template org-shared. Ports the js-sdk's
    /// userCanMakeTemplateShared.
    ///
    /// <example>
    /// <code>
    /// if (TemplatePermissions.UserCanMakeTemplateShared(profile, template))
    /// {
    ///     // ...
    /// }
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="profile">The profile to check, or null for no session.</param>
    /// <param name="template">The template to check against.</param>
    /// <returns>True when the user may change the template's visibility to shared.</returns>
    /// <sdkOperation>template.userCanMakeTemplateShared</sdkOperation>
    /// <sdkGroup>Template</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
    public static bool UserCanMakeTemplateShared(Profile? profile, Template template) =>
        UserIsTemplateCreator(profile, template)
            ? SessionPermissions.UserHasPermissions(profile, [TemplatePermission.CreateOrg])
            : SessionPermissions.UserHasPermissions(profile, [TemplatePermission.MemberVisibility]);

    /// <summary>
    /// True when the user can make the template public. Ports the js-sdk's
    /// userCanMakeTemplatePublic.
    ///
    /// <example>
    /// <code>
    /// if (TemplatePermissions.UserCanMakeTemplatePublic(profile, template))
    /// {
    ///     // ...
    /// }
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="profile">The profile to check, or null for no session.</param>
    /// <param name="template">The template to check against.</param>
    /// <returns>True when the user may change the template's visibility to public.</returns>
    /// <sdkOperation>template.userCanMakeTemplatePublic</sdkOperation>
    /// <sdkGroup>Template</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
    public static bool UserCanMakeTemplatePublic(Profile? profile, Template template) =>
        UserIsTemplateCreator(profile, template)
            ? SessionPermissions.UserHasPermissions(profile, [TemplatePermission.CreatePublic])
            : SessionPermissions.UserHasPermissions(profile, [TemplatePermission.MemberVisibility]);

    /// <summary>
    /// True when the user, as the template's creator, can change whether it is personal vs
    /// org-shared. Ports the js-sdk's userCanChangeOrgVisibility.
    ///
    /// <example>
    /// <code>
    /// if (TemplatePermissions.UserCanChangeOrgVisibility(profile, template))
    /// {
    ///     // ...
    /// }
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="profile">The profile to check, or null for no session.</param>
    /// <param name="template">The template to check against.</param>
    /// <returns>True when the user may change the template's organization visibility.</returns>
    /// <sdkOperation>template.userCanChangeOrgVisibility</sdkOperation>
    /// <sdkGroup>Template</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
    public static bool UserCanChangeOrgVisibility(Profile? profile, Template template) =>
        UserIsTemplateCreator(profile, template) &&
        SessionPermissions.UserHasPermissions(profile, [TemplatePermission.CreatePersonal]);

    /// <summary>
    /// True when the user can delete the template. Ports the js-sdk's userCanDeleteTemplate.
    ///
    /// <example>
    /// <code>
    /// if (TemplatePermissions.UserCanDeleteTemplate(profile, template))
    /// {
    ///     // ...
    /// }
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="profile">The profile to check, or null for no session.</param>
    /// <param name="template">The template to check against.</param>
    /// <returns>True when the user may delete the template.</returns>
    /// <sdkOperation>template.userCanDeleteTemplate</sdkOperation>
    /// <sdkGroup>Template</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
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
    ///
    /// <example>
    /// <code>
    /// if (TemplatePermissions.UserCanSendTemplate(profile, template))
    /// {
    ///     // ...
    /// }
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="profile">The profile to check, or null for no session.</param>
    /// <param name="template">The template to check against.</param>
    /// <returns>True when the user may send the template.</returns>
    /// <sdkOperation>template.userCanSendTemplate</sdkOperation>
    /// <sdkGroup>Template</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
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
    ///
    /// <example>
    /// <code>
    /// if (TemplatePermissions.UserCanCreateTemplate(profile))
    /// {
    ///     // ...
    /// }
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="profile">The profile to check, or null for no session.</param>
    /// <returns>True when the user holds any of the template-create permissions.</returns>
    /// <sdkOperation>template.userCanCreateTemplate</sdkOperation>
    /// <sdkGroup>Template</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
    public static bool UserCanCreateTemplate(Profile? profile) =>
        UserCanCreatePersonalTemplate(profile) ||
        UserCanCreateOrgTemplate(profile) ||
        UserCanCreatePublicTemplate(profile);

    /// <summary>
    /// True when the user can "build" the template (use the field builder): the user must
    /// have write access and the template must have at least one signer role. Ports the
    /// js-sdk's userCanBuildTemplate.
    ///
    /// <example>
    /// <code>
    /// if (TemplatePermissions.UserCanBuildTemplate(profile, template))
    /// {
    ///     // ...
    /// }
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="profile">The profile to check, or null for no session.</param>
    /// <param name="template">The template to check against.</param>
    /// <returns>True when the user may open the template in the builder.</returns>
    /// <sdkOperation>template.userCanBuildTemplate</sdkOperation>
    /// <sdkGroup>Template</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
    public static bool UserCanBuildTemplate(Profile? profile, Template template) =>
        UserCanUpdateTemplate(profile, template) &&
        (template.Roles ?? []).Any(role => role.Type == RecipientType.Signer);

    /// <summary>
    /// The template's fields assigned to the named role. Ports the js-sdk's getFieldsForRole.
    ///
    /// <example>
    /// <code>
    /// var fields = TemplatePermissions.GetFieldsForRole(template, "Signer1");
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="template">The template to scan.</param>
    /// <param name="roleName">The role name to filter by.</param>
    /// <returns>The fields assigned to the role.</returns>
    /// <sdkOperation>template.getFieldsForRole</sdkOperation>
    /// <sdkGroup>Template</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
    public static IReadOnlyList<TemplateField> GetFieldsForRole(Template template, string roleName) =>
        (template.Fields ?? []).Where(field => field.RoleName == roleName).ToList();

    /// <summary>
    /// True when the user can preview the template: the user must have read access, the
    /// template must have at least one signer, and every signer must have at least one field.
    /// Ports the js-sdk's userCanPreviewTemplate.
    ///
    /// <example>
    /// <code>
    /// if (TemplatePermissions.UserCanPreviewTemplate(profile, template))
    /// {
    ///     // ...
    /// }
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="profile">The profile to check, or null for no session.</param>
    /// <param name="template">The template to check against.</param>
    /// <returns>True when the user may preview the template.</returns>
    /// <sdkOperation>template.userCanPreviewTemplate</sdkOperation>
    /// <sdkGroup>Template</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
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
    ///
    /// <example>
    /// <code>
    /// var (canPerform, message) = TemplatePermissions.CanPerformTemplateAction(profile, TemplateAction.Delete, template);
    /// if (!canPerform)
    /// {
    ///     Console.WriteLine(message);
    /// }
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="profile">The profile to check, or null for no session.</param>
    /// <param name="action">The action to test; see <see cref="TemplateAction"/> for known values.</param>
    /// <param name="template">The template to act on, required for everything except the create actions.</param>
    /// <returns>CanPerform, plus a Message explaining the denial (empty when allowed).</returns>
    /// <sdkOperation>template.canPerformTemplateAction</sdkOperation>
    /// <sdkGroup>Template</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
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
    ///
    /// <example>
    /// <code>
    /// if (TemplatePermissions.HasRequiredPermissions(profile, new[] { TemplatePermission.MemberWrite }))
    /// {
    ///     // ...
    /// }
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="profile">The profile to check, or null for no session.</param>
    /// <param name="permissions">The permissions that must all be present.</param>
    /// <returns>True when every requested permission is directly held.</returns>
    /// <sdkOperation>template.hasRequiredPermissions</sdkOperation>
    /// <sdkGroup>Template</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
    public static bool HasRequiredPermissions(Profile? profile, IEnumerable<string> permissions) =>
        permissions.All(perm => (profile?.Permissions ?? []).Contains(perm));
}
