import {TPermission} from '../BaseTypes';
import {IProfile} from '../Models';

/**
 * Confirm whether the user has all of the specified permissions.
 */
export const userHasPermissions = (profile: IProfile | null | undefined, permissions: TPermission[]) =>
  permissions.every((perm) => (profile?.permissions || []).includes(perm));
