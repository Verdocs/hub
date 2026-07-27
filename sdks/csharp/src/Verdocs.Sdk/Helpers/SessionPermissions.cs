using Verdocs.Models;

namespace Verdocs.Helpers;

/// <summary>
/// Role-to-permission expansion and permission checks for user profiles, ported from the
/// js-sdk's Sessions/Permissions.ts. All checks run locally on data already fetched; nothing
/// here calls the API, and the server remains the authority on what a caller may actually do.
/// </summary>
public static class SessionPermissions
{
    /// <summary>
    /// The permissions each user role confers, ported from the js-sdk's RolePermissions map.
    /// Keys are the <see cref="ProfileRole"/> values.
    /// </summary>
    public static IReadOnlyDictionary<string, IReadOnlyList<string>> RolePermissions { get; } =
        new Dictionary<string, IReadOnlyList<string>>
        {
            [ProfileRole.Owner] =
            [
                TemplatePermission.CreatePublic,
                TemplatePermission.CreateOrg,
                TemplatePermission.CreatePersonal,
                TemplatePermission.Delete,
                TemplatePermission.Visibility,
                TemplatePermission.MemberRead,
                TemplatePermission.MemberWrite,
                TemplatePermission.MemberDelete,
                TemplatePermission.MemberVisibility,
                AccountPermission.OwnerAdd,
                AccountPermission.OwnerRemove,
                AccountPermission.AdminAdd,
                AccountPermission.AdminRemove,
                AccountPermission.MemberView,
                AccountPermission.MemberAdd,
                AccountPermission.MemberRemove,
                OrganizationPermission.Create,
                OrganizationPermission.View,
                OrganizationPermission.Update,
                OrganizationPermission.Delete,
                OrganizationPermission.Transfer,
                OrganizationPermission.List,
                EnvelopePermission.Create,
                EnvelopePermission.Cancel,
                EnvelopePermission.View,
            ],
            [ProfileRole.Admin] =
            [
                TemplatePermission.CreatePublic,
                TemplatePermission.CreateOrg,
                TemplatePermission.CreatePersonal,
                TemplatePermission.Delete,
                TemplatePermission.Visibility,
                TemplatePermission.MemberRead,
                TemplatePermission.MemberWrite,
                TemplatePermission.MemberDelete,
                TemplatePermission.MemberVisibility,
                AccountPermission.AdminAdd,
                AccountPermission.AdminRemove,
                AccountPermission.MemberView,
                AccountPermission.MemberAdd,
                AccountPermission.MemberRemove,
                OrganizationPermission.Create,
                OrganizationPermission.View,
                OrganizationPermission.Update,
                OrganizationPermission.List,
                EnvelopePermission.Create,
                EnvelopePermission.Cancel,
                EnvelopePermission.View,
            ],
            [ProfileRole.Member] =
            [
                TemplatePermission.CreatePublic,
                TemplatePermission.CreateOrg,
                TemplatePermission.CreatePersonal,
                TemplatePermission.Delete,
                TemplatePermission.Visibility,
                TemplatePermission.MemberRead,
                TemplatePermission.MemberWrite,
                TemplatePermission.MemberDelete,
                AccountPermission.MemberView,
                OrganizationPermission.Create,
                OrganizationPermission.View,
                OrganizationPermission.List,
                EnvelopePermission.Create,
                EnvelopePermission.Cancel,
                EnvelopePermission.View,
            ],
            [ProfileRole.BasicUser] =
            [
                TemplatePermission.MemberRead,
                AccountPermission.MemberView,
                OrganizationPermission.View,
                OrganizationPermission.List,
            ],
            [ProfileRole.Contact] =
            [
                OrganizationPermission.View,
                OrganizationPermission.List,
                OrganizationPermission.Create,
            ],
        };

    /// <summary>
    /// True when the profile has every one of the specified permissions, whether granted
    /// directly, by a role, or through a group. Ports the js-sdk's userHasPermissions
    /// (Sessions/Permissions.ts). An empty permission list always passes.
    /// </summary>
    /// <param name="profile">The profile to check, or null for no session (always fails a non-empty check).</param>
    /// <param name="permissions">The permissions that must all be present.</param>
    /// <returns>True when every requested permission is held.</returns>
    /// <sdkOperation>permission.userHasPermissions</sdkOperation>
    /// <sdkGroup>Permissions</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
    public static bool UserHasPermissions(Profile? profile, IEnumerable<string> permissions)
    {
        // No need to de-dupe here, we're just checking present-at-least-once set membership.
        var netPermissions = new List<string>(profile?.Permissions ?? []);
        foreach (var role in profile?.Roles ?? [])
        {
            if (RolePermissions.TryGetValue(role, out var rolePermissions))
            {
                netPermissions.AddRange(rolePermissions);
            }
        }

        foreach (var groupProfile in profile?.GroupProfiles ?? [])
        {
            netPermissions.AddRange(groupProfile.Group?.Permissions ?? []);
        }

        return permissions.All(netPermissions.Contains);
    }
}
