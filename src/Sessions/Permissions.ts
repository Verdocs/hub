import {IProfile} from '../Models';

export type TTemplatePermission =
  | 'template:creator:create:public'
  | 'template:creator:create:org'
  | 'template:creator:create:personal'
  | 'template:creator:delete'
  | 'template:creator:visibility'
  | 'template:member:read'
  | 'template:member:write'
  | 'template:member:delete'
  | 'template:member:visibility';

export type TAccountPermission =
  | 'owner:add'
  | 'owner:remove'
  | 'admin:add'
  | 'admin:remove'
  | 'member:view'
  | 'member:add'
  | 'member:remove';

export type TOrgPermission = 'org:create' | 'org:view' | 'org:update' | 'org:delete' | 'org:transfer' | 'org:list';

export type TEnvelopePermission = 'envelope:create' | 'envelope:cancel' | 'envelope:view';

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
