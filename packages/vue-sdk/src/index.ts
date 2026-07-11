export { default as VerdocsProvider } from './provider/VerdocsProvider.vue';
export type { VerdocsProviderProps } from './provider/VerdocsProvider.vue';
export { VERDOCS_ENDPOINT_KEY } from './provider/keys';
export { useVerdocs, type IVerdocsContext } from './provider/useVerdocs';
export { useSession, type ISessionState } from './composables/useSession';
export { useTemplates } from './composables/useTemplates';

export { default as VerdocsAuth } from './components/VerdocsAuth/VerdocsAuth.vue';
export type { VerdocsAuthProps, TAuthMode } from './components/VerdocsAuth/VerdocsAuth.vue';
export { default as VerdocsTemplatesList } from './components/VerdocsTemplatesList/VerdocsTemplatesList.vue';
export type {
  VerdocsTemplatesListProps,
  TAllowedTemplateAction,
  TStarredFilter,
} from './components/VerdocsTemplatesList/VerdocsTemplatesList.vue';

export { default as VerdocsButton } from './controls/VerdocsButton.vue';
export type { VerdocsButtonProps } from './controls/VerdocsButton.vue';
export { default as VerdocsTextInput } from './controls/VerdocsTextInput.vue';
export type { VerdocsTextInputProps } from './controls/VerdocsTextInput.vue';
export { default as VerdocsSpinner } from './controls/VerdocsSpinner.vue';
export type { VerdocsSpinnerProps } from './controls/VerdocsSpinner.vue';
export { default as VerdocsQuickFilter } from './controls/VerdocsQuickFilter.vue';
export type { VerdocsQuickFilterProps, IFilterOption } from './controls/VerdocsQuickFilter.vue';
export { default as VerdocsDropdown } from './controls/VerdocsDropdown.vue';
export type { VerdocsDropdownProps, IMenuOption } from './controls/VerdocsDropdown.vue';
export { default as VerdocsPagination } from './controls/VerdocsPagination.vue';
export type { VerdocsPaginationProps } from './controls/VerdocsPagination.vue';
export { default as VerdocsCheckbox } from './controls/VerdocsCheckbox.vue';
export type { VerdocsCheckboxProps } from './controls/VerdocsCheckbox.vue';
export { default as VerdocsRadioButton } from './controls/VerdocsRadioButton.vue';
export type { VerdocsRadioButtonProps } from './controls/VerdocsRadioButton.vue';
export { default as VerdocsSwitch } from './controls/VerdocsSwitch.vue';
export type { VerdocsSwitchProps } from './controls/VerdocsSwitch.vue';
export { default as VerdocsToggle } from './controls/VerdocsToggle.vue';
export type { VerdocsToggleProps, IToggleButton } from './controls/VerdocsToggle.vue';
export { default as VerdocsLoader } from './controls/VerdocsLoader.vue';
export { default as VerdocsProgressBar } from './controls/VerdocsProgressBar.vue';
export type { VerdocsProgressBarProps } from './controls/VerdocsProgressBar.vue';
export { default as VerdocsHelpIcon } from './controls/VerdocsHelpIcon.vue';
export { default as VerdocsToolbarIcon } from './controls/VerdocsToolbarIcon.vue';
export type { VerdocsToolbarIconProps } from './controls/VerdocsToolbarIcon.vue';
export { default as VerdocsComponentError } from './controls/VerdocsComponentError.vue';
export type { VerdocsComponentErrorProps } from './controls/VerdocsComponentError.vue';
export { default as VerdocsFlag } from './controls/VerdocsFlag.vue';
export type { VerdocsFlagProps } from './controls/VerdocsFlag.vue';
export { default as VerdocsSelectInput } from './controls/VerdocsSelectInput.vue';
export type { VerdocsSelectInputProps, ISelectOption } from './controls/VerdocsSelectInput.vue';
export { default as VerdocsDateInput } from './controls/VerdocsDateInput.vue';
export type { VerdocsDateInputProps } from './controls/VerdocsDateInput.vue';
export { default as VerdocsFileChooser } from './controls/VerdocsFileChooser.vue';
export type { VerdocsFileChooserProps } from './controls/VerdocsFileChooser.vue';
export { default as VerdocsMultiSelect } from './controls/VerdocsMultiSelect.vue';
export type { VerdocsMultiSelectProps, IMultiSelectOption } from './controls/VerdocsMultiSelect.vue';
export { default as VerdocsPortal } from './controls/VerdocsPortal.vue';
export type { VerdocsPortalProps } from './controls/VerdocsPortal.vue';
export { default as VerdocsMenuPanel } from './controls/VerdocsMenuPanel.vue';
export type { VerdocsMenuPanelProps } from './controls/VerdocsMenuPanel.vue';
export { default as VerdocsTabs } from './controls/VerdocsTabs.vue';
export type { VerdocsTabsProps, ITab } from './controls/VerdocsTabs.vue';
export { default as VerdocsToggleButton } from './controls/VerdocsToggleButton.vue';
export type { VerdocsToggleButtonProps } from './controls/VerdocsToggleButton.vue';
export { default as VerdocsButtonPanel } from './controls/VerdocsButtonPanel.vue';
export type { VerdocsButtonPanelProps } from './controls/VerdocsButtonPanel.vue';
export { default as VerdocsTable } from './controls/VerdocsTable.vue';
export type { VerdocsTableProps, ITableColumn } from './controls/VerdocsTable.vue';
export { default as VerdocsOrganizationCard } from './controls/VerdocsOrganizationCard.vue';
export type { VerdocsOrganizationCardProps } from './controls/VerdocsOrganizationCard.vue';

export { type FieldBaseProps, signerClassName, fieldValue } from './fields/types';
export { default as VerdocsFieldCheckbox } from './fields/VerdocsFieldCheckbox.vue';
export type { VerdocsFieldCheckboxProps } from './fields/VerdocsFieldCheckbox.vue';
export { default as VerdocsFieldRadio } from './fields/VerdocsFieldRadio.vue';
export type { VerdocsFieldRadioProps } from './fields/VerdocsFieldRadio.vue';
export { default as VerdocsFieldDropdown } from './fields/VerdocsFieldDropdown.vue';
export type { VerdocsFieldDropdownProps } from './fields/VerdocsFieldDropdown.vue';
export { default as VerdocsFieldTextbox } from './fields/VerdocsFieldTextbox.vue';
export type { VerdocsFieldTextboxProps } from './fields/VerdocsFieldTextbox.vue';
export { default as VerdocsFieldTextarea } from './fields/VerdocsFieldTextarea.vue';
export type { VerdocsFieldTextareaProps } from './fields/VerdocsFieldTextarea.vue';
export { default as VerdocsFieldDate } from './fields/VerdocsFieldDate.vue';
export type { VerdocsFieldDateProps } from './fields/VerdocsFieldDate.vue';
export { default as VerdocsFieldTimestamp } from './fields/VerdocsFieldTimestamp.vue';
export type { VerdocsFieldTimestampProps } from './fields/VerdocsFieldTimestamp.vue';
export { default as VerdocsFieldAttachment } from './fields/VerdocsFieldAttachment.vue';
export type { VerdocsFieldAttachmentProps } from './fields/VerdocsFieldAttachment.vue';
export { default as VerdocsFieldSignature } from './fields/VerdocsFieldSignature.vue';
export type { VerdocsFieldSignatureProps } from './fields/VerdocsFieldSignature.vue';
export { default as VerdocsFieldInitial } from './fields/VerdocsFieldInitial.vue';
export type { VerdocsFieldInitialProps } from './fields/VerdocsFieldInitial.vue';
export { default as VerdocsFieldPayment } from './fields/VerdocsFieldPayment.vue';
export type { VerdocsFieldPaymentProps } from './fields/VerdocsFieldPayment.vue';

export { showToast, type IToastConfig } from './utils/toast';
export { SDKError, type IAuthStatus, type ITemplateEvent } from './types';

export { default as VerdocsDialog } from './dialogs/VerdocsDialog.vue';
export type { VerdocsDialogProps } from './dialogs/VerdocsDialog.vue';
export { default as VerdocsOkDialog } from './dialogs/VerdocsOkDialog.vue';
export type { VerdocsOkDialogProps } from './dialogs/VerdocsOkDialog.vue';
export { default as VerdocsQuestionDialog } from './dialogs/VerdocsQuestionDialog.vue';
export type { VerdocsQuestionDialogProps } from './dialogs/VerdocsQuestionDialog.vue';
export { default as VerdocsUploadDialog } from './dialogs/VerdocsUploadDialog.vue';
export type { VerdocsUploadDialogProps } from './dialogs/VerdocsUploadDialog.vue';
export { default as VerdocsKbaDialog } from './dialogs/VerdocsKbaDialog.vue';
export type { VerdocsKbaDialogProps, IKbaIdentityDetails, IKbaAnswer } from './dialogs/VerdocsKbaDialog.vue';
export { default as VerdocsOtpDialog } from './dialogs/VerdocsOtpDialog.vue';
export type { VerdocsOtpDialogProps } from './dialogs/VerdocsOtpDialog.vue';
export { default as VerdocsPasscodeDialog } from './dialogs/VerdocsPasscodeDialog.vue';
export type { VerdocsPasscodeDialogProps } from './dialogs/VerdocsPasscodeDialog.vue';
export { default as VerdocsDelegateDialog } from './dialogs/VerdocsDelegateDialog.vue';
export type { IDelegateDetails } from './dialogs/VerdocsDelegateDialog.vue';
export { default as VerdocsDisclosureDialog } from './dialogs/VerdocsDisclosureDialog.vue';
export type { VerdocsDisclosureDialogProps } from './dialogs/VerdocsDisclosureDialog.vue';
export { default as VerdocsDownloadDialog } from './dialogs/VerdocsDownloadDialog.vue';
export type { VerdocsDownloadDialogProps, IDownloadSelection, TDownloadVariant } from './dialogs/VerdocsDownloadDialog.vue';
export { default as VerdocsSigningProgress } from './dialogs/VerdocsSigningProgress.vue';
export type { VerdocsSigningProgressProps, TSigningProgressMode } from './dialogs/VerdocsSigningProgress.vue';
export { default as VerdocsAdoptSignatureDialog } from './dialogs/VerdocsAdoptSignatureDialog.vue';
export type { VerdocsAdoptSignatureDialogProps, IAdoptedSignature } from './dialogs/VerdocsAdoptSignatureDialog.vue';
export { default as VerdocsSignatureDialog } from './dialogs/VerdocsSignatureDialog.vue';
export type { VerdocsSignatureDialogProps } from './dialogs/VerdocsSignatureDialog.vue';
export { default as VerdocsInitialDialog } from './dialogs/VerdocsInitialDialog.vue';
export type { VerdocsInitialDialogProps } from './dialogs/VerdocsInitialDialog.vue';

export {
  useEnvelopes, useEnvelope, useUpdateRecipient, useRemindRecipient, useResetRecipient,
  useUpdateEnvelope, useCancelEnvelope, useInPersonLink,
  type TUpdateEnvelopeParams, type IUpdateRecipientVariables,
} from './composables/useEnvelopes';
export { default as VerdocsEnvelopesList } from './components/VerdocsEnvelopesList/VerdocsEnvelopesList.vue';
export type { VerdocsEnvelopesListProps, TEnvelopesListView, TEnvelopesSortBy, IEnvelopeEvent } from './components/VerdocsEnvelopesList/VerdocsEnvelopesList.vue';
export { default as VerdocsStatusIndicator, getStatusColor, getStatusMessage } from './components/envelopes/VerdocsStatusIndicator.vue';
export type { VerdocsStatusIndicatorProps, TIndicatorStatus } from './components/envelopes/VerdocsStatusIndicator.vue';
export { default as VerdocsEnvelopeRecipientLink } from './components/envelopes/VerdocsEnvelopeRecipientLink.vue';
export type { VerdocsEnvelopeRecipientLinkProps } from './components/envelopes/VerdocsEnvelopeRecipientLink.vue';
export { default as VerdocsEnvelopeSidebar } from './components/envelopes/VerdocsEnvelopeSidebar.vue';
export type { VerdocsEnvelopeSidebarProps, IEnvelopeUpdatedEvent, IEnvelopeRecipientEvent } from './components/envelopes/VerdocsEnvelopeSidebar.vue';
export { default as VerdocsEnvelopeRecipientSummary } from './components/envelopes/VerdocsEnvelopeRecipientSummary.vue';
export type { VerdocsEnvelopeRecipientSummaryProps } from './components/envelopes/VerdocsEnvelopeRecipientSummary.vue';
export { default as VerdocsEnvelopeUpdateRecipient } from './components/envelopes/VerdocsEnvelopeUpdateRecipient.vue';
export type { VerdocsEnvelopeUpdateRecipientProps } from './components/envelopes/VerdocsEnvelopeUpdateRecipient.vue';
export { default as VerdocsContactPicker } from './components/envelopes/VerdocsContactPicker.vue';
export type { VerdocsContactPickerProps, TPickerContact, IContactSelectEvent } from './components/envelopes/VerdocsContactPicker.vue';
export { default as VerdocsSignFooter } from './components/envelopes/VerdocsSignFooter.vue';
export type { VerdocsSignFooterProps } from './components/envelopes/VerdocsSignFooter.vue';
export { default as VerdocsEnvelopeDocumentPage } from './components/envelopes/VerdocsEnvelopeDocumentPage.vue';
export type { VerdocsEnvelopeDocumentPageProps, IDocumentPageInfo } from './components/envelopes/VerdocsEnvelopeDocumentPage.vue';

export { useTemplate, useCreateTemplate, useUpdateTemplate, useDeleteTemplate } from './composables/useTemplateDetail';
export {
  useCreateTemplateRole, useUpdateTemplateRole, useDeleteTemplateRole,
  useCreateTemplateField, useUpdateTemplateField, useDeleteTemplateField,
} from './composables/useTemplateStructure';
export { default as VerdocsTemplateCard, type VerdocsTemplateCardProps } from './components/templates/VerdocsTemplateCard.vue';
export { default as VerdocsTemplateTags, type VerdocsTemplateTagsProps } from './components/templates/VerdocsTemplateTags.vue';
export { default as VerdocsTemplateBuildTabs, type VerdocsTemplateBuildTabsProps, type TVerdocsBuildStep } from './components/templates/VerdocsTemplateBuildTabs.vue';
export { default as VerdocsTemplateDocumentPage, type VerdocsTemplateDocumentPageProps } from './components/templates/VerdocsTemplateDocumentPage.vue';
export { default as VerdocsTemplateCreate, type VerdocsTemplateCreateProps } from './components/templates/VerdocsTemplateCreate.vue';
export { default as VerdocsTemplateSettings, type VerdocsTemplateSettingsProps } from './components/templates/VerdocsTemplateSettings.vue';
export { default as VerdocsTemplateAttachments, type VerdocsTemplateAttachmentsProps } from './components/templates/VerdocsTemplateAttachments.vue';
export { default as VerdocsTemplateRoles, type VerdocsTemplateRolesProps, type IRolesUpdatedEvent } from './components/templates/VerdocsTemplateRoles.vue';
export { default as VerdocsTemplateRoleProperties, type VerdocsTemplateRolePropertiesProps } from './components/templates/VerdocsTemplateRoleProperties.vue';
export { default as VerdocsTemplateFields, type VerdocsTemplateFieldsProps, type ITemplateFieldsEvent } from './components/templates/VerdocsTemplateFields.vue';
export { default as VerdocsTemplateFieldProperties, type VerdocsTemplateFieldPropertiesProps } from './components/templates/VerdocsTemplateFieldProperties.vue';
