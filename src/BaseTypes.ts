import {IEnvelope} from './Models';

export type TRequestStatus = 'OK' | 'ERROR';

export type TTemplateSenderType = 'creator' | 'organization_member' | 'organization_member_as_creator' | 'everyone' | 'everyone_as_creator';

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

export type TTemplateAction =
  | 'create_personal'
  | 'create_org'
  | 'create_public'
  | 'read'
  | 'write'
  | 'delete'
  | 'change_visibility_personal'
  | 'change_visibility_org'
  | 'change_visibility_public';

export type TAccountPermission =
  | 'owner:add'
  | 'owner:remove'
  | 'admin:add'
  | 'admin:remove'
  | 'member:view'
  | 'member:add'
  | 'member:remove';

export type TOrgPermission = 'org:create' | 'org:view' | 'org:update' | 'org:delete' | 'org:transfer' | 'org:list';

export type TApiKeyPermission = 'personal' | 'global_read' | 'global_write';

/**
 * Operation within Verdocs that users may perform.
 */
export type TPermission = TTemplatePermission | TOrgPermission | TAccountPermission;

export type TRecipientAction = 'submit' | 'decline' | 'prepare' | 'update';

export type TEnvelopeStatus = 'complete' | 'pending' | 'in progress' | 'declined' | 'canceled';

export type TRecipientStatus = 'invited' | 'opened' | 'signed' | 'submitted' | 'canceled' | 'pending' | 'declined';

export type TRecipientType = 'signer' | 'cc' | 'approver';

/**
 * Plans provide access to Verdocs product features.
 */
export type TPlan = 'env:essential' | 'org:standard';

/**
 * Roles provide access to groups of permissions. Note that for historical reasons there is some overlap in the
 * use of the term "role". TRole refers to a user type. A "Role" (IRole) is a Template participant placeholder.
 */
export type TRole = 'contact' | 'basic_user' | 'member' | 'admin' | 'owner';

export type TSortTemplateBy = 'created_at' | 'updated_at' | 'name' | 'last_used_at' | 'counter' | 'star_counter';

export type TAccessKeyType = 'email' | 'in_app' | 'in_person_link' | 'sms';

export type THistoryEvent =
  | 'recipient:signed'
  | 'recipient:opened'
  | 'recipient:submitted'
  | 'recipient:prepared'
  | 'recipient:claimed'
  | 'recipient:agreed'
  | 'recipient:invited'
  | 'recipient:delegated'
  | 'recipient:updated_info'
  | 'recipient:declined'
  | 'invitation:resent'
  | 'envelope:cc'
  // TODO: These were removed and are not actually in use. See the created_at, updated_at (if status is completed)
  //  and canceled_at fields to identify these states.
  | 'created'
  | 'completed'
  | 'canceled'
  | 'owner:updated_recipient_info'
  | 'owner:canceled'
  | 'owner:get_in_person_link';

export type TEventDetail =
  | 'in_app'
  | 'mail'
  | 'signer'
  | 'sms'
  | 'reminder'
  | 'preparer'
  | 'manual'
  | 'in_person_link'
  | 'guest'
  | 'email'
  | ''
  | string; // Modification events have a string description

export type TEnvelopeUpdateResult = Omit<IEnvelope, 'histories' | 'recipients' | 'certificate' | 'document' | 'fields' | 'profile'>;

export type TFieldType =
  | 'signature'
  | 'initial'
  | 'checkbox_group'
  | 'radio_button_group'
  | 'textbox'
  | 'timestamp'
  | 'date'
  | 'dropdown'
  | 'textarea'
  | 'attachment'
  | 'payment';
