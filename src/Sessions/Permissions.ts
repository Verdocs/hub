import {IProfile} from '../Models';

/**
 * Create public templates. Public templates are still owned and managed by the creator,
 * but may be searched for and used to create envelopes by other users.
 */
export type TTemplatePermissionCreatePublic = 'template:creator:create:public';

/**
 * Create templates shared with other users of the same organization.
 */
export type TTemplatePermissionCreateOrg = 'template:creator:create:org';

/**
 * Create templates private to the creator.
 */
export type TTemplatePermissionCreatePersonal = 'template:creator:create:personal';

/**
 * Create templates private to the creator.
 */
export type TTemplatePermissionDelete = 'template:creator:delete';

/**
 * Alter the visiiblity settings on a template.
 */
export type TTemplatePermissionVisibility = 'template:creator:visibility';

/**
 * View templates shared by other members of the same organization. Those templates must also
 * have `is_personal` set to false to be visible.
 */
export type TTemplateMemberRead = 'template:member:read';

/**
 * Edit templates shared by other members of the same organization. Those templates must also
 * have `is_personal` set to false to be editable.
 */
export type TTemplateMemberWrite = 'template:member:write';

/**
 * Edit templates shared by other members of the same organization. Those templates must also
 * have `is_personal` set to false to be editable.
 */
export type TTemplateMemberDelete = 'template:member:delete';

/**
 * Edit templates shared by other members of the same organization. Those templates must also
 * have `is_personal` set to false to be editable.
 */
export type TTemplateMemberVisibility = 'template:member:visibility';

export type TTemplatePermission =
  | TTemplatePermissionCreatePublic
  | TTemplatePermissionCreateOrg
  | TTemplatePermissionCreatePersonal
  | TTemplatePermissionDelete
  | TTemplatePermissionVisibility
  | TTemplateMemberRead
  | TTemplateMemberWrite
  | TTemplateMemberDelete
  | TTemplateMemberVisibility;

/**
 * Grant the "owner" role to other organization members.
 */
export type TAccountPermissionOwnerAdd = 'owner:add';

/**
 * Remove the "owner" role from other organization members.
 */
export type TAccountPermissionOwnerRemove = 'owner:remove';

/**
 * Grant the "admin" role to other organization members.
 */
export type TAccountPermissionAdminAdd = 'admin:add';

/**
 * Remove the "admin" role from other organization members.
 */
export type TAccountPermissionAdminRemove = 'admin:remove';

/**
 * View the members of an organization.
 */
export type TAccountPermissionMemberView = 'member:view';

/**
 * Grant the "member" role to other organization members.
 */
export type TAccountPermissionMemberAdd = 'member:add';

/**
 * Remove the "member" role from other organization members.
 */
export type TAccountPermissionMemberRemove = 'member:remove';

export type TAccountPermission =
  | TAccountPermissionOwnerAdd
  | TAccountPermissionOwnerRemove
  | TAccountPermissionAdminAdd
  | TAccountPermissionAdminRemove
  | TAccountPermissionMemberAdd
  | TAccountPermissionMemberRemove
  | TAccountPermissionMemberView;

/**
 * Create a new organization.
 * @deprecated This is a system-wide setting and organization owners cannot prevent their
 * members from listing other organizations that they may have separate profiles in.
 */
export type TOrgPermissionCreate = 'org:create';

/**
 * View the organization.
 */
export type TOrgPermissionView = 'org:view';

/**
 * Update the organization.
 */
export type TOrgPermissionUpdate = 'org:update';

/**
 * Delete the organization.
 */
export type TOrgPermissionDelete = 'org:delete';

/**
 * Transfer ownership of the organization. This primarily allows the holder to remove his/her own
 * Owner role or add new Owners even if the holder is not one themselves. This is primarily intended
 * to be used for reseller scenarios.
 */
export type TOrgPermissionTransfer = 'org:transfer';

/**
 * List organizations.
 * @deprecated This is a system-wide setting and organization owners cannot prevent their
 * members from listing other organizations that they may have separate profiles in.
 */
export type TOrgPermissionList = 'org:list';

export type TOrgPermission =
  | TOrgPermissionCreate
  | TOrgPermissionView
  | TOrgPermissionUpdate
  | TOrgPermissionDelete
  | TOrgPermissionTransfer
  | TOrgPermissionList;

/**
 * Create envelopes.
 */
export type TEnvelopePermissionCreate = 'envelope:create';

/**
 * Cancel envelopes. This is a default permission for most users, but it may be removed for
 * highly regulated environments where envelope activities must be audited, and should not
 * be canceled.
 */
export type TEnvelopePermissionCancel = 'envelope:cancel';

/**
 * View envelopes. This is a default permission for most users, but it may be removed for
 * highly regulated environments where once sent, envelopes may only be viewed by specific
 * users.
 */
export type TEnvelopePermissionView = 'envelope:view';

/**
 * View envelopes created by other members of the same organization. By default, only templates
 * having sharing settings controlled by their creators. Envelopes are usually private to the
 * callers who created them. In some organizations it may be useful to have users who can see
 * "all activity" by all organization members. This is particularly useful when applied to API
 * keys to develop applications that can access all data across the organization.
 */
export type TEnvelopePermissionOrg = 'envelope:org:view';

export type TEnvelopePermission = TEnvelopePermissionCreate | TEnvelopePermissionCancel | TEnvelopePermissionView | TEnvelopePermissionOrg;

/**
 * Operation within Verdocs that users may perform.
 */
export type TPermission = TTemplatePermission | TOrgPermission | TAccountPermission | TEnvelopePermission;

/**
 * Roles provide access to groups of permissions. Note that for historical reasons there is some overlap in the
 * use of the term "role". TRole refers to a user type. A "Role" (IRole) is a Template participant placeholder.
 */
export type TRole = 'contact' | 'basic_user' | 'member' | 'admin' | 'owner';

/**
 * A map of the permissions each role confers.
 */
export const RolePermissions: Record<TRole, TPermission[]> = {
  owner: [
    'template:creator:create:public',
    'template:creator:create:org',
    'template:creator:create:personal',
    'template:creator:delete',
    'template:creator:visibility',
    'template:member:read',
    'template:member:write',
    'template:member:delete',
    'template:member:visibility',
    'owner:add',
    'owner:remove',
    'admin:add',
    'admin:remove',
    'member:view',
    'member:add',
    'member:remove',
    'org:create',
    'org:view',
    'org:update',
    'org:delete',
    'org:transfer',
    'org:list',
    'envelope:create',
    'envelope:cancel',
    'envelope:view',
  ],
  admin: [
    'template:creator:create:public',
    'template:creator:create:org',
    'template:creator:create:personal',
    'template:creator:delete',
    'template:creator:visibility',
    'template:member:read',
    'template:member:write',
    'template:member:delete',
    'template:member:visibility',
    'admin:add',
    'admin:remove',
    'member:view',
    'member:add',
    'member:remove',
    'org:create',
    'org:view',
    'org:update',
    'org:list',
    'envelope:create',
    'envelope:cancel',
    'envelope:view',
  ],
  member: [
    'template:creator:create:public',
    'template:creator:create:org',
    'template:creator:create:personal',
    'template:creator:delete',
    'template:creator:visibility',
    'template:member:read',
    'template:member:write',
    'template:member:delete',
    'member:view',
    'org:create',
    'org:view',
    'org:list',
    'envelope:create',
    'envelope:cancel',
    'envelope:view',
  ],
  basic_user: ['template:member:read', 'member:view', 'org:view', 'org:list'],
  contact: ['org:view', 'org:list', 'org:create'],
};

/**
 * Confirm whether the user has all of the specified permissions.
 */
export const userHasPermissions = (profile: IProfile | null | undefined, permissions: TPermission[]) => {
  // No need to de-dupe here, we're just checking present-at-least-once set membership.
  const netPermissions = [...(profile?.permissions || [])];
  (profile?.roles || []).forEach((role) => {
    netPermissions.push(...(RolePermissions[role] || []));
  });

  (profile?.group_profiles || []).forEach((groupProfile) => {
    netPermissions.push(...(groupProfile.group?.permissions || []));
  });

  return permissions.every((perm) => netPermissions.includes(perm));
};
