import {IEnvelope} from './Models';

export type TRequestStatus = 'OK' | 'ERROR';

export type TTemplateSenderType = 'creator' | 'organization_member' | 'organization_member_as_creator' | 'everyone' | 'everyone_as_creator';

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

export type TRecipientAction = 'submit' | 'decline' | 'prepare' | 'update';

export type TEnvelopeStatus = 'complete' | 'pending' | 'in progress' | 'declined' | 'canceled';

export type TRecipientStatus = 'invited' | 'opened' | 'signed' | 'submitted' | 'canceled' | 'pending' | 'declined';

export type TRecipientType = 'signer' | 'cc' | 'approver';

/**
 * Plans provide access to Verdocs product features.
 */
// export type TPlan = 'env:essential' | 'org:standard';

export type TSortTemplateBy = 'created_at' | 'updated_at' | 'name' | 'last_used_at' | 'counter' | 'star_counter';

export type TAccessKeyType = 'email' | 'in_app' | 'in_person_link' | 'sms';

export type TApiKeyPermission = 'personal' | 'global_read' | 'global_write';

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
  | 'checkbox'
  | 'radio_button_group'
  | 'radio'
  | 'textbox'
  | 'timestamp'
  | 'date'
  | 'dropdown'
  | 'textarea'
  | 'attachment'
  | 'payment';
