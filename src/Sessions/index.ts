export * as Types from './Types';

import {TSession} from './Types';

/**
 * Confirm whether the user has all of the specified permissions.
 */
export const userHasPermissions = (session: TSession, permissions: string[]) =>
  permissions.every((perm) => (session?.permissions || []).includes(perm));
