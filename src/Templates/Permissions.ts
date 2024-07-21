/**
 * Various helpers to identify available operations for a template by a user.
 *
 * @module
 */

import {userHasPermissions} from '../Sessions';
import {IProfile, ITemplate} from '../Models';

/**
 * Check to see if the user created the template.
 */
export const userIsTemplateCreator = (profile: IProfile | null | undefined, template: ITemplate) =>
  profile && template && profile.id === template.profile_id;

/**
 * Check to see if a template is "shared" with the user.
 */
export const userHasSharedTemplate = (profile: IProfile | null | undefined, template: ITemplate) =>
  profile && template && !template.is_personal && profile.organization_id === template.organization_id;

/**
 * Check to see if the user can create a personal/private template.
 */
export const userCanCreatePersonalTemplate = (profile: IProfile | null | undefined) =>
  userHasPermissions(profile, ['template:creator:create:personal']);

/**
 * Check to see if the user can create an org-shared template.
 */
export const userCanCreateOrgTemplate = (profile: IProfile | null | undefined) =>
  userHasPermissions(profile, ['template:creator:create:org']);

/**
 * Check to see if the user can create a public template.
 */
export const userCanCreatePublicTemplate = (profile: IProfile | null | undefined) =>
  userHasPermissions(profile, ['template:creator:create:public']);

/**
 * Check to see if the user can read/view a template.
 */
export const userCanReadTemplate = (profile: IProfile | null | undefined, template: ITemplate) =>
  template.is_public ||
  userIsTemplateCreator(profile, template) ||
  (userHasSharedTemplate(profile, template) && userHasPermissions(profile, ['template:member:read']));

/**
 * Check to see if the user can update a tempate.
 */
export const userCanUpdateTemplate = (profile: IProfile | null | undefined, template: ITemplate) =>
  userIsTemplateCreator(profile, template) ||
  (userHasSharedTemplate(profile, template) && userHasPermissions(profile, ['template:member:read', 'template:member:write']));

/**
 * Check to see if the user can change whether a template is personal vs org-shared.
 */
export const userCanMakeTemplatePrivate = (profile: IProfile | null | undefined, template: ITemplate) =>
  userIsTemplateCreator(profile, template)
    ? userHasPermissions(profile, ['template:creator:create:personal'])
    : userHasPermissions(profile, ['template:member:visibility']);

/**
 * Check to see if the user can change whether a template is personal vs org-shared.
 */
export const userCanMakeTemplateShared = (profile: IProfile | null | undefined, template: ITemplate) =>
  userIsTemplateCreator(profile, template)
    ? userHasPermissions(profile, ['template:creator:create:org'])
    : userHasPermissions(profile, ['template:member:visibility']);

/**
 * Check to see if the user can change whether a template is personal vs org-shared.
 */
export const userCanMakeTemplatePublic = (profile: IProfile | null | undefined, template: ITemplate) =>
  userIsTemplateCreator(profile, template)
    ? userHasPermissions(profile, ['template:creator:create:public'])
    : userHasPermissions(profile, ['template:member:visibility']);

/**
 * Check to see if the user can change whether a template is personal vs org-shared.
 */
export const userCanChangeOrgVisibility = (profile: IProfile | null | undefined, template: ITemplate) =>
  userIsTemplateCreator(profile, template) && userHasPermissions(profile, ['template:creator:create:personal']);

/**
 * Check to see if the user can change whether a template is personal vs org-shared.
 */
export const userCanDeleteTemplate = (profile: IProfile | null | undefined, template: ITemplate) =>
  userIsTemplateCreator(profile, template)
    ? userHasPermissions(profile, ['template:creator:delete'])
    : userHasPermissions(profile, ['template:member:delete']);

/**
 * Confirm whether the user can create an envelope using the specified template.
 */
export const userCanSendTemplate = (profile: IProfile | null | undefined, template: ITemplate) => {
  switch (template.sender) {
    case 'creator':
      return userIsTemplateCreator(profile, template);
    case 'organization_member':
    case 'organization_member_as_creator':
      return userIsTemplateCreator(profile, template) || template.organization_id === profile?.organization_id;
    // 'everyone' | 'everyone_as_creator';
    default:
      return true;
  }
};

/**
 * Confirm whether the user can create a new template.
 */
export const userCanCreateTemplate = (profile: IProfile | null | undefined) =>
  userCanCreatePersonalTemplate(profile) || userCanCreateOrgTemplate(profile) || userCanCreatePublicTemplate(profile);

/**
 * Check to see if the user can "build" the template (use the field builder). The user must have write access to the
 * template, and the template must have at least one signer role.
 */
export const userCanBuildTemplate = (profile: IProfile | null | undefined, template: ITemplate) =>
  userCanUpdateTemplate(profile, template) && (template.roles || []).filter((role) => role.type === 'signer').length > 0;

export const getFieldsForRole = (template: ITemplate, role_name: string) =>
  (template.fields || []).filter((field) => field.role_name === role_name);

/**
 * Check to see if the user can preview the template. The user must have read access to the template, the template must
 * have at least one signer, and every signer must have at least one field.
 */
export const userCanPreviewTemplate = (profile: IProfile | null | undefined, template: ITemplate) => {
  const hasPermission = userCanReadTemplate(profile, template);
  const signers = (template.roles || []).filter((role) => role.type === 'signer');
  return hasPermission && signers.length > 0 && signers.every((signer) => getFieldsForRole(template, signer.name).length > 0);
};
