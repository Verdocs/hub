import type { IRole, ITemplate, ITemplateField } from '@verdocs/js-sdk';
import type { ITemplateEvent } from '../types.js';

/**
 * Shared event contracts for the templates group. Centralized the way
 * dialogs/dialog-events.ts and fields/field-base.ts are: several template
 * elements dispatch these, and declaring each event's type once here keeps the
 * GlobalEventHandlersEventMap entries from drifting apart across files.
 *
 * The already-global events these elements reuse (vdocs-sdk-error from
 * vdocs-auth, and vdocs-ok / vdocs-cancel / vdocs-close from the dialogs and
 * menu panel) are intentionally not redeclared here.
 */

/** The steps in the template builder, in presentation order. */
export type TVerdocsBuildStep = 'attachments' | 'roles' | 'fields' | 'preview';

/** Detail for vdocs-roles-updated, fired by vdocs-template-roles. */
export interface IRolesUpdatedEvent {
  endpoint: import('@verdocs/js-sdk').VerdocsEndpoint;
  templateId: string;
  event: 'added' | 'deleted' | 'updated';
  roles: IRole[];
}

/** Detail for vdocs-role-deleted, fired by vdocs-template-role-properties. */
export interface IRoleDeletedDetail {
  templateId: string;
  roleName: string;
}

/** Detail for vdocs-template-updated, fired by vdocs-template-fields. */
export interface ITemplateFieldsEvent {
  endpoint: import('@verdocs/js-sdk').VerdocsEndpoint;
  template: ITemplate;
  event: 'updated-field' | 'deleted-field';
}

/** Detail for vdocs-field-settings-changed, fired by vdocs-template-field-properties. */
export interface IFieldSettingsChangedDetail {
  fieldName: string;
  field: ITemplateField;
}

/** Detail for vdocs-field-deleted, fired by vdocs-template-field-properties. */
export interface IFieldDeletedDetail {
  templateId: string;
  fieldName: string;
}

declare global {
  interface GlobalEventHandlersEventMap {
    // vdocs-template-card
    'vdocs-select-template': CustomEvent<ITemplate>;
    // vdocs-template-create
    'vdocs-template-created': CustomEvent<ITemplate>;
    // vdocs-template-build-tabs
    'vdocs-select-step': CustomEvent<TVerdocsBuildStep>;
    // vdocs-template-settings
    'vdocs-settings-changed': CustomEvent<ITemplateEvent>;
    // vdocs-template-attachments
    'vdocs-attachments-changed': CustomEvent<ITemplateEvent>;
    // The builder-advance events (react-sdk's onNext). They carry different
    // payloads and are named per component because the dialogs group already
    // owns a payload-less vdocs-next (signing progress) we must not redefine.
    'vdocs-attachments-next': CustomEvent<ITemplateEvent>;
    'vdocs-roles-next': CustomEvent<undefined>;
    // vdocs-template-roles
    'vdocs-roles-updated': CustomEvent<IRolesUpdatedEvent>;
    // vdocs-template-role-properties
    'vdocs-role-deleted': CustomEvent<IRoleDeletedDetail>;
    // vdocs-template-fields
    'vdocs-template-updated': CustomEvent<ITemplateFieldsEvent>;
    // vdocs-template-field-properties
    'vdocs-field-settings-changed': CustomEvent<IFieldSettingsChangedDetail>;
    'vdocs-field-deleted': CustomEvent<IFieldDeletedDetail>;
  }
}
