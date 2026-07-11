/**
 * @verdocs/wc-sdk: native Lit web components for the Verdocs platform.
 *
 * Importing this module registers every element (the tags are usable as soon
 * as the import runs). The classes are also exported for subclassing and for
 * typed property access, and each element module augments
 * HTMLElementTagNameMap so createElement and querySelector come back typed.
 */

export { VdocsElement } from './base/vdocs-element.js';
export { register } from './base/register.js';
export { resolveEndpoint } from './base/endpoint.js';
export { SessionController } from './base/session-controller.js';
export { TemplatesController, invalidateTemplateLists, templatesListKey, type ITemplatesPage, type ITemplatesQuery } from './store/templates.js';

export { VdocsButton, type TButtonSize, type TButtonVariant } from './controls/vdocs-button.js';
export { VdocsTextInput, type TTextInputType } from './controls/vdocs-text-input.js';
export { VdocsSpinner } from './controls/vdocs-spinner.js';
export { VdocsQuickFilter, type IFilterOption } from './controls/vdocs-quick-filter.js';
export { VdocsDropdown, type IMenuOption } from './controls/vdocs-dropdown.js';
export { VdocsPagination } from './controls/vdocs-pagination.js';
export { VdocsCheckbox, type TCheckboxSize, type TCheckboxTheme } from './controls/vdocs-checkbox.js';
export { VdocsRadioButton } from './controls/vdocs-radio-button.js';
export { VdocsSwitch, type TSwitchTheme } from './controls/vdocs-switch.js';
export { VdocsToggle, type IToggleButton } from './controls/vdocs-toggle.js';
export { VdocsLoader } from './controls/vdocs-loader.js';
export { VdocsProgressBar } from './controls/vdocs-progress-bar.js';
export { VdocsHelpIcon } from './controls/vdocs-help-icon.js';
export { VdocsToolbarIcon, type TTooltipPlacement } from './controls/vdocs-toolbar-icon.js';
export { VdocsComponentError } from './controls/vdocs-component-error.js';
export { VdocsFlag, type TFlagVariant } from './controls/vdocs-flag.js';
export { VdocsSelectInput, type ISelectOption } from './controls/vdocs-select-input.js';
export { VdocsDateInput } from './controls/vdocs-date-input.js';
export { VdocsFileChooser } from './controls/vdocs-file-chooser.js';
export { VdocsMultiSelect, type IMultiSelectOption } from './controls/vdocs-multi-select.js';
export { VdocsPortal } from './controls/vdocs-portal.js';
export { VdocsMenuPanel } from './controls/vdocs-menu-panel.js';
export { VdocsTabs, type ITab, type ITabSelectEvent } from './controls/vdocs-tabs.js';
export { VdocsToggleButton } from './controls/vdocs-toggle-button.js';
export { VdocsButtonPanel } from './controls/vdocs-button-panel.js';
export { VdocsTable, type ITableColumn } from './controls/vdocs-table.js';
export { VdocsOrganizationCard } from './controls/vdocs-organization-card.js';

export { VdocsAuth, type TAuthMode } from './components/vdocs-auth.js';
export { VdocsTemplatesList, type TAllowedTemplateAction, type TStarredFilter } from './components/vdocs-templates-list.js';

export { fieldValue, signerClassName, type IFieldBaseProperties, type IFieldChangeDetail } from './fields/field-base.js';
export { VdocsFieldAttachment } from './fields/vdocs-field-attachment.js';
export { VdocsFieldCheckbox } from './fields/vdocs-field-checkbox.js';
export { VdocsFieldDate } from './fields/vdocs-field-date.js';
export { VdocsFieldDropdown } from './fields/vdocs-field-dropdown.js';
export { VdocsFieldInitial } from './fields/vdocs-field-initial.js';
export { VdocsFieldPayment } from './fields/vdocs-field-payment.js';
export { VdocsFieldRadio } from './fields/vdocs-field-radio.js';
export { VdocsFieldSignature } from './fields/vdocs-field-signature.js';
export { VdocsFieldTextarea } from './fields/vdocs-field-textarea.js';
export { VdocsFieldTextbox } from './fields/vdocs-field-textbox.js';
export { VdocsFieldTimestamp } from './fields/vdocs-field-timestamp.js';

export { showToast, type IToastConfig } from './utils/toast.js';
export { SDKError, type IAuthStatus, type ITemplateEvent } from './types.js';

export { VdocsDialog } from './dialogs/vdocs-dialog.js';
export { VdocsOkDialog } from './dialogs/vdocs-ok-dialog.js';
export { VdocsQuestionDialog } from './dialogs/vdocs-question-dialog.js';
export { VdocsUploadDialog } from './dialogs/vdocs-upload-dialog.js';
export { VdocsKbaDialog } from './dialogs/vdocs-kba-dialog.js';
export { VdocsOtpDialog } from './dialogs/vdocs-otp-dialog.js';
export { VdocsPasscodeDialog } from './dialogs/vdocs-passcode-dialog.js';
export { VdocsDelegateDialog } from './dialogs/vdocs-delegate-dialog.js';
export { VdocsDisclosureDialog } from './dialogs/vdocs-disclosure-dialog.js';
export { VdocsDownloadDialog } from './dialogs/vdocs-download-dialog.js';
export { VdocsSigningProgress, type TSigningProgressMode } from './dialogs/vdocs-signing-progress.js';
export { VdocsAdoptSignatureDialog } from './dialogs/vdocs-adopt-signature-dialog.js';
export { VdocsSignatureDialog } from './dialogs/vdocs-signature-dialog.js';
export { VdocsInitialDialog } from './dialogs/vdocs-initial-dialog.js';
export type {
  IAdoptedSignature,
  IDelegateDetails,
  IKbaIdentityDetails,
  IKbaAnswer,
  TDownloadVariant,
  IDownloadSelection,
} from './dialogs/dialog-events.js';

export {
  TemplateController, invalidateTemplateDetail, templateDetailKey, type ITemplateDetailQuery,
  createTemplate, updateTemplate, deleteTemplate,
  createTemplateRole, updateTemplateRole, deleteTemplateRole,
  createTemplateField, updateTemplateField, deleteTemplateField,
  createTemplateDocument, deleteTemplateDocument,
} from './store/template-detail.js';
export { VdocsTemplateCard } from './components/vdocs-template-card.js';
export { VdocsTemplateTags } from './components/vdocs-template-tags.js';
export { VdocsTemplateDocumentPage } from './components/vdocs-template-document-page.js';
export { VdocsTemplateBuildTabs } from './components/vdocs-template-build-tabs.js';
export { VdocsTemplateCreate } from './components/vdocs-template-create.js';
export { VdocsTemplateSettings } from './components/vdocs-template-settings.js';
export { VdocsTemplateAttachments } from './components/vdocs-template-attachments.js';
export { VdocsTemplateRoleProperties } from './components/vdocs-template-role-properties.js';
export { VdocsTemplateRoles } from './components/vdocs-template-roles.js';
export { VdocsTemplateFieldProperties } from './components/vdocs-template-field-properties.js';
export { VdocsTemplateFields } from './components/vdocs-template-fields.js';
export type {
  TVerdocsBuildStep, IRolesUpdatedEvent, IRoleDeletedDetail,
  ITemplateFieldsEvent, IFieldSettingsChangedDetail, IFieldDeletedDetail,
} from './components/template-events.js';

export { EnvelopesListController, EnvelopeDetailController, invalidateEnvelopeLists, invalidateEnvelope, envelopesListKey, envelopeDetailKey, type IEnvelopesPage, type IEnvelopesListQuery, type IEnvelopeDetailQuery } from './store/envelopes.js';
export { VdocsEnvelopesList, type TEnvelopesListView, type TEnvelopesSortBy, type IEnvelopeEvent } from './components/vdocs-envelopes-list.js';
export { VdocsStatusIndicator, getStatusColor, getStatusMessage, type TIndicatorStatus, type TStatusIndicatorTheme, type TStatusIndicatorSize } from './components/vdocs-status-indicator.js';
export { VdocsEnvelopeRecipientLink } from './components/vdocs-envelope-recipient-link.js';
export { VdocsEnvelopeSidebar, type IEnvelopeUpdatedEvent, type IEnvelopeRecipientEvent } from './components/vdocs-envelope-sidebar.js';
export { VdocsEnvelopeRecipientSummary } from './components/vdocs-envelope-recipient-summary.js';
export { VdocsEnvelopeUpdateRecipient } from './components/vdocs-envelope-update-recipient.js';
export { VdocsContactPicker, type TPickerContact, type IContactSelectEvent } from './components/vdocs-contact-picker.js';
export { VdocsSignFooter } from './components/vdocs-sign-footer.js';
export { VdocsEnvelopeDocumentPage, type IDocumentPageInfo } from './components/vdocs-envelope-document-page.js';
