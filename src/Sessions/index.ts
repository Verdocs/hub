import {TPermission} from '../Users/Types';
export * as Types from './Types';
import {TSession} from './Types';

/**
 * Confirm whether the user has all of the specified permissions.
 */
export const userHasPermissions = (session: TSession, permissions: TPermission[]) =>
  permissions.every((perm) => (session?.permissions || []).includes(perm));
