import {ITemplate, ITemplateSummary} from './Types';
import {TSession} from '../Sessions/Types';

export enum TemplateSenderTypes {
  CREATOR = 'creator', // same as legacy
  ORGANIZATION_MEMBER = 'organization_member',
  ORGANIZATION_MEMBER_AS_CREATOR = 'organization_member_as_creator',
  EVERYONE = 'everyone',
  EVERYONE_AS_CREATOR = 'everyone_as_creator', // Creator would be sender of envelope no matter who creates the envelope
}

export enum TemplatePermissions {
  TEMPLATE_CREATOR_CREATE_PUBLIC = 'template:creator:create:public',
  TEMPLATE_CREATOR_CREATE_ORG = 'template:creator:create:org',
  TEMPLATE_CREATOR_CREATE_PERSONAL = 'template:creator:create:personal',
  TEMPLATE_CREATOR_DELETE = 'template:creator:delete',
  TEMPLATE_CREATOR_VISIBILITY = 'template:creator:visibility',
  TEMPLATE_MEMBER_READ = 'template:member:read',
  TEMPLATE_MEMBER_WRITE = 'template:member:write',
  TEMPLATE_MEMBER_DELETE = 'template:member:delete',
  TEMPLATE_MEMBER_VISIBILITY = 'template:member:visibility',
}

export type TTemplateActions =
  | 'create_personal'
  | 'create_org'
  | 'create_public'
  | 'read'
  | 'write'
  | 'delete'
  | 'change_visibility_personal'
  | 'change_visibility_org'
  | 'change_visibility_public';

export const canPerformTemplateAction = (
  session: TSession,
  action: TTemplateActions,
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

  const permissionsRequired = [];
  switch (action) {
    case 'create_personal':
      permissionsRequired.push(TemplatePermissions.TEMPLATE_CREATOR_CREATE_PERSONAL);
      break;
    case 'create_org':
      permissionsRequired.push(TemplatePermissions.TEMPLATE_CREATOR_CREATE_ORG);
      break;
    case 'create_public':
      permissionsRequired.push(TemplatePermissions.TEMPLATE_CREATOR_CREATE_PUBLIC);
      break;
    case 'read':
      if (!isCreator) {
        if ((!isPersonal && isSameOrg) || !isPublic) {
          permissionsRequired.push(TemplatePermissions.TEMPLATE_MEMBER_READ);
        }
      }
      break;
    case 'write':
      if (!isCreator) {
        permissionsRequired.push(TemplatePermissions.TEMPLATE_MEMBER_READ);
        permissionsRequired.push(TemplatePermissions.TEMPLATE_MEMBER_WRITE);
      }
      break;
    case 'change_visibility_personal':
      if (isCreator) {
        permissionsRequired.push(TemplatePermissions.TEMPLATE_CREATOR_CREATE_PERSONAL);
      } else {
        permissionsRequired.push(TemplatePermissions.TEMPLATE_MEMBER_VISIBILITY);
      }
      break;
    case 'change_visibility_org':
      if (isCreator) {
        permissionsRequired.push(TemplatePermissions.TEMPLATE_CREATOR_CREATE_ORG);
      } else {
        permissionsRequired.push(TemplatePermissions.TEMPLATE_MEMBER_VISIBILITY);
      }
      break;
    case 'change_visibility_public':
      if (isCreator) {
        permissionsRequired.push(TemplatePermissions.TEMPLATE_CREATOR_CREATE_PUBLIC);
        permissionsRequired.push(TemplatePermissions.TEMPLATE_CREATOR_VISIBILITY);
      } else {
        permissionsRequired.push(TemplatePermissions.TEMPLATE_MEMBER_VISIBILITY);
      }
      break;
    case 'delete':
      if (isCreator) {
        permissionsRequired.push(TemplatePermissions.TEMPLATE_CREATOR_DELETE);
      } else {
        permissionsRequired.push(TemplatePermissions.TEMPLATE_MEMBER_DELETE);
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
