/**
 * Various helpers to identify available operations for a template by a user.
 *
 * @module
 */

import {TSession, userHasPermissions} from '../Sessions';
import {ITemplateSummary} from './Types';
import {ITemplate} from '../Models';

/**
 * Check to see if the user created the template.
 */
export const userIsTemplateCreator = (session: TSession, template: ITemplate | ITemplateSummary) =>
  session && template && session.profile_id === template.profile_id;

/**
 * Check to see if a template is "shared" with the user.
 */
export const userHasSharedTemplate = (session: TSession, template: ITemplate | ITemplateSummary) =>
  session && template && !template.is_personal && session.organization_id === template.organization_id;

/**
 * Check to see if the user can create a personal/private template.
 */
export const userCanCreatePersonalTemplate = (session: TSession) => userHasPermissions(session, ['template:creator:create:personal']);

/**
 * Check to see if the user can create an org-shared template.
 */
export const userCanCreateOrgTemplate = (session: TSession) => userHasPermissions(session, ['template:creator:create:org']);

/**
 * Check to see if the user can create a public template.
 */
export const userCanCreatePublicTemplate = (session: TSession) => userHasPermissions(session, ['template:creator:create:public']);

/**
 * Check to see if the user can read/view a template.
 */
export const userCanReadTemplate = (session: TSession, template: ITemplate | ITemplateSummary) =>
  template.is_public ||
  userIsTemplateCreator(session, template) ||
  (userHasSharedTemplate(session, template) && userHasPermissions(session, ['template:member:read']));

/**
 * Check to see if the user can update a tempate.
 */
export const userCanUpdateTemplate = (session: TSession, template: ITemplate | ITemplateSummary) =>
  userIsTemplateCreator(session, template) ||
  (userHasSharedTemplate(session, template) && userHasPermissions(session, ['template:member:read', 'template:member:write']));

/**
 * Check to see if the user can change whether a template is personal vs org-shared.
 */
export const userCanMakeTemplatePrivate = (session: TSession, template: ITemplate | ITemplateSummary) =>
  userIsTemplateCreator(session, template)
    ? userHasPermissions(session, ['template:creator:create:personal'])
    : userHasPermissions(session, ['template:member:visibility']);

/**
 * Check to see if the user can change whether a template is personal vs org-shared.
 */
export const userCanMakeTemplateShared = (session: TSession, template: ITemplate | ITemplateSummary) =>
  userIsTemplateCreator(session, template)
    ? userHasPermissions(session, ['template:creator:create:org'])
    : userHasPermissions(session, ['template:member:visibility']);

/**
 * Check to see if the user can change whether a template is personal vs org-shared.
 */
export const userCanMakeTemplatePublic = (session: TSession, template: ITemplate | ITemplateSummary) =>
  userIsTemplateCreator(session, template)
    ? userHasPermissions(session, ['template:creator:create:public'])
    : userHasPermissions(session, ['template:member:visibility']);

/**
 * Check to see if the user can change whether a template is personal vs org-shared.
 */
export const userCanChangeOrgVisibility = (session: TSession, template: ITemplate | ITemplateSummary) =>
  userIsTemplateCreator(session, template) && userHasPermissions(session, ['template:creator:create:personal']);

/**
 * Check to see if the user can change whether a template is personal vs org-shared.
 */
export const userCanDeleteTemplate = (session: TSession, template: ITemplate | ITemplateSummary) =>
  userIsTemplateCreator(session, template)
    ? userHasPermissions(session, ['template:creator:delete'])
    : userHasPermissions(session, ['template:member:delete']);

/**
 * Confirm whether the user can create an envelope using the specified template.
 */
export const userCanSendTemplate = (session: TSession, template: ITemplate | ITemplateSummary) => {
  switch (template.sender) {
    case 'creator':
      return userIsTemplateCreator(session, template);
    case 'organization_member':
    case 'organization_member_as_creator':
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

export const getFieldsForRole = (template: ITemplate, role_name: string) =>
  (template.fields || []).filter((field) => field.role_name === role_name);

/**
 * Check to see if the user can preview the template. The user must have read access to the template, the template must
 * have at least one signer, and every signer must have at least one field.
 */
export const userCanPreviewTemplate = (session: TSession, template: ITemplate) => {
  const hasPermission = userCanReadTemplate(session, template);
  const signers = (template.roles || []).filter((role) => role.type === 'signer');
  return hasPermission && signers.length > 0 && signers.every((signer) => getFieldsForRole(template, signer.name).length > 0);
};
