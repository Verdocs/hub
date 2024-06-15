import {TTemplateAction, TTemplatePermission} from '../BaseTypes';
import {ITemplateSummary} from './Types';
import {TSession} from '../Sessions';
import {ITemplate} from '../Models';

export const canPerformTemplateAction = (
  session: TSession,
  action: TTemplateAction,
  template?: ITemplate | ITemplateSummary,
): {canPerform: boolean; message: string} => {
  if (!template && !action.includes('create')) {
    return {canPerform: false, message: 'Missing required template object'};
  }

  // We use BOGUS here to force the option-chain in things like template?.profile_id to NOT match profile?.profile_id because if both
  // were undefined, they would actually match.
  const profile_id = session?.profile_id || 'BOGUS';
  const organization_id = session?.organization_id || 'BOGUS';

  if (!profile_id) {
    return {canPerform: false, message: 'Active session required'};
  }

  const isCreator = template?.profile_id === profile_id;
  const isSameOrg = template?.organization_id === organization_id;
  const isPersonal = template?.is_personal ?? false;
  const isPublic = template?.is_public ?? false;

  const permissionsRequired: TTemplatePermission[] = [];
  switch (action) {
    case 'create_personal':
      permissionsRequired.push('template:creator:create:personal');
      break;
    case 'create_org':
      permissionsRequired.push('template:creator:create:org');
      break;
    case 'create_public':
      permissionsRequired.push('template:creator:create:public');
      break;
    case 'read':
      if (!isCreator) {
        if ((!isPersonal && isSameOrg) || !isPublic) {
          permissionsRequired.push('template:member:read');
        }
      }
      break;
    case 'write':
      if (!isCreator) {
        permissionsRequired.push('template:member:read');
        permissionsRequired.push('template:member:write');
      }
      break;
    case 'change_visibility_personal':
      if (isCreator) {
        permissionsRequired.push('template:creator:create:personal');
      } else {
        permissionsRequired.push('template:member:visibility');
      }
      break;
    case 'change_visibility_org':
      if (isCreator) {
        permissionsRequired.push('template:creator:create:org');
      } else {
        permissionsRequired.push('template:member:visibility');
      }
      break;
    case 'change_visibility_public':
      if (isCreator) {
        permissionsRequired.push('template:creator:create:public');
        permissionsRequired.push('template:creator:visibility');
      } else {
        permissionsRequired.push('template:member:visibility');
      }
      break;
    case 'delete':
      if (isCreator) {
        permissionsRequired.push('template:creator:delete');
      } else {
        permissionsRequired.push('template:member:delete');
      }
      break;
    default:
      return {canPerform: false, message: 'Action is not defined'};
  }

  if (hasRequiredPermissions(session, permissionsRequired)) {
    return {canPerform: true, message: ''};
  }

  return {canPerform: false, message: `Insufficient access to perform '${action}'. Needed permissions: ${permissionsRequired.toString()}`};
};

export const hasRequiredPermissions = (session: TSession, permissions: string[]) =>
  permissions.every((perm) => (session?.permissions || []).includes(perm));
