/**
 * Various helpers to identify available operations for a template by a user.
 *
 * @module
 */

import {ITemplate, ITemplateSummaryEntry, TemplateSenderTypes} from './Types';
import {userHasPermissions} from '../Sessions';
import {Permissions} from '../Users/Types';
import {TSession} from '../Sessions/Types';

/**
 * Check to see if the user created the template.
 */
export const userIsTemplateCreator = (session: TSession, template: ITemplate | ITemplateSummaryEntry) =>
  session && template && session.profile_id === template.profile_id;

/**
 * Check to see if a template is "shared" with the user.
 */
export const userHasSharedTemplate = (session: TSession, template: ITemplate | ITemplateSummaryEntry) =>
  session && template && !template.is_personal && session.organization_id === template.organization_id;

/**
 * Check to see if the user can create a personal/private template.
 */
export const userCanCreatePersonalTemplate = (session: TSession) =>
  userHasPermissions(session, [Permissions.TEMPLATE_CREATOR_CREATE_PERSONAL]);

/**
 * Check to see if the user can create an org-shared template.
 */
export const userCanCreateOrgTemplate = (session: TSession) => userHasPermissions(session, [Permissions.TEMPLATE_CREATOR_CREATE_ORG]);

/**
 * Check to see if the user can create a public template.
 */
export const userCanCreatePublicTemplate = (session: TSession) => userHasPermissions(session, [Permissions.TEMPLATE_CREATOR_CREATE_PUBLIC]);

/**
 * Check to see if the user can read/view a template.
 */
export const userCanReadTemplate = (session: TSession, template: ITemplate | ITemplateSummaryEntry) =>
  template.is_public ||
  userIsTemplateCreator(session, template) ||
  (userHasSharedTemplate(session, template) && userHasPermissions(session, [Permissions.TEMPLATE_MEMBER_READ]));

/**
 * Check to see if the user can update a tempate.
 */
export const userCanUpdateTemplate = (session: TSession, template: ITemplate | ITemplateSummaryEntry) =>
  userIsTemplateCreator(session, template) ||
  (userHasSharedTemplate(session, template) &&
    userHasPermissions(session, [Permissions.TEMPLATE_MEMBER_READ, Permissions.TEMPLATE_MEMBER_WRITE]));

/**
 * Check to see if the user can change whether a template is personal vs org-shared.
 */
export const userCanMakeTemplatePrivate = (session: TSession, template: ITemplate | ITemplateSummaryEntry) =>
  userIsTemplateCreator(session, template)
    ? userHasPermissions(session, [Permissions.TEMPLATE_CREATOR_CREATE_PERSONAL])
    : userHasPermissions(session, [Permissions.TEMPLATE_MEMBER_VISIBILITY]);

/**
 * Check to see if the user can change whether a template is personal vs org-shared.
 */
export const userCanMakeTemplateShared = (session: TSession, template: ITemplate | ITemplateSummaryEntry) =>
  userIsTemplateCreator(session, template)
    ? userHasPermissions(session, [Permissions.TEMPLATE_CREATOR_CREATE_ORG])
    : userHasPermissions(session, [Permissions.TEMPLATE_MEMBER_VISIBILITY]);

/**
 * Check to see if the user can change whether a template is personal vs org-shared.
 */
export const userCanMakeTemplatePublic = (session: TSession, template: ITemplate | ITemplateSummaryEntry) =>
  userIsTemplateCreator(session, template)
    ? userHasPermissions(session, [Permissions.TEMPLATE_CREATOR_CREATE_PUBLIC])
    : userHasPermissions(session, [Permissions.TEMPLATE_MEMBER_VISIBILITY]);

/**
 * Check to see if the user can change whether a template is personal vs org-shared.
 */
export const userCanChangeOrgVisibility = (session: TSession, template: ITemplate | ITemplateSummaryEntry) =>
  userIsTemplateCreator(session, template) && userHasPermissions(session, [Permissions.TEMPLATE_CREATOR_CREATE_PERSONAL]);

/**
 * Check to see if the user can change whether a template is personal vs org-shared.
 */
export const userCanDeleteTemplate = (session: TSession, template: ITemplate | ITemplateSummaryEntry) =>
  userIsTemplateCreator(session, template)
    ? userHasPermissions(session, [Permissions.TEMPLATE_CREATOR_DELETE])
    : userHasPermissions(session, [Permissions.TEMPLATE_MEMBER_DELETE]);

/**
 * Confirm whether the user can create an envelope using the specified template.
 */
export const userCanSendTemplate = (session: TSession, template: ITemplate | ITemplateSummaryEntry) => {
  switch (template.sender) {
    case TemplateSenderTypes.CREATOR:
      return userIsTemplateCreator(session, template);
    case TemplateSenderTypes.ORGANIZATION_MEMBER:
    case TemplateSenderTypes.ORGANIZATION_MEMBER_AS_CREATOR:
      return userIsTemplateCreator(session, template) || template.organization_id === session?.organization_id;
    default:
      return true;
  }
};

/**
 * Confirm whether the user can create a new template.
 */
export const userCanCreateTemplate = (session: TSession) =>
  userCanCreatePersonalTemplate(session) || userCanCreateOrgTemplate(session) || userCanCreatePublicTemplate(session);

/**
 * Check to see if the user can "build" the template (use the field builder). The user must have write access to the
 * template, and the template must have at least one signer role.
 */
export const userCanBuildTemplate = (session: TSession, template: ITemplate) =>
  userCanUpdateTemplate(session, template) && (template.roles || []).filter((role) => role.type === 'signer').length > 0;

/**
 * Check to see if the user can preview the template. The user must have read access to the template, the template must
 * have at least one signer, and every signer must have at least one field.
 */
export const userCanPreviewTemplate = (session: TSession, template: ITemplate) => {
  const hasPermission = userCanReadTemplate(session, template);
  const signers = (template.roles || []).filter((role) => role.type === 'signer');
  return hasPermission && signers.length > 0 && signers.every((signer) => (signer.fields || []).length > 0);
};
