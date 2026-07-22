export { provideVerdocs, injectVerdocsEndpoint, VERDOCS_ENDPOINT, type VerdocsConfig } from './lib/provide-verdocs';
export { VerdocsSessionService, createSessionSignals, type ISessionSignals } from './lib/session';
export { VerdocsTemplatesService, type ITemplatesPage, type ITemplatesQuery } from './lib/templates';

export { VerdocsAuthComponent, type TAuthMode } from './lib/components/auth.component';
export {
  VerdocsTemplatesListComponent,
  type TAllowedTemplateAction,
  type TStarredFilter,
} from './lib/components/templates-list/templates-list.component';

export { VerdocsButtonComponent } from './lib/controls/button.component';
export { VerdocsTextInputComponent } from './lib/controls/text-input.component';
export { VerdocsSpinnerComponent } from './lib/controls/spinner.component';
export { VerdocsQuickFilterComponent, type IFilterOption } from './lib/controls/quick-filter.component';
export { VerdocsDropdownComponent, type IMenuOption } from './lib/controls/dropdown.component';
export { VerdocsPaginationComponent } from './lib/controls/pagination.component';
export { VerdocsCheckboxComponent } from './lib/controls/checkbox.component';
export { VerdocsRadioButtonComponent } from './lib/controls/radio-button.component';
export { VerdocsSwitchComponent } from './lib/controls/switch.component';
export { VerdocsToggleComponent, type IToggleButton } from './lib/controls/toggle.component';
export { VerdocsLoaderComponent } from './lib/controls/loader.component';
export { VerdocsProgressBarComponent } from './lib/controls/progress-bar.component';
export { VerdocsHelpIconComponent } from './lib/controls/help-icon.component';
export { VerdocsToolbarIconComponent } from './lib/controls/toolbar-icon.component';
export { VerdocsComponentErrorComponent } from './lib/controls/component-error.component';
export { VerdocsFlagComponent } from './lib/controls/flag.component';
export { VerdocsSelectInputComponent, type ISelectOption } from './lib/controls/select-input.component';
export { VerdocsDateInputComponent } from './lib/controls/date-input.component';
export { VerdocsFileChooserComponent } from './lib/controls/file-chooser.component';
export { VerdocsMultiSelectComponent, type IMultiSelectOption } from './lib/controls/multi-select.component';
export { VerdocsPortalComponent } from './lib/controls/portal.component';
export { VerdocsMenuPanelComponent } from './lib/controls/menu-panel.component';
export { VerdocsTabsComponent, type ITab } from './lib/controls/tabs.component';
export { VerdocsToggleButtonComponent } from './lib/controls/toggle-button.component';
export { VerdocsButtonPanelComponent } from './lib/controls/button-panel.component';
export { VerdocsTableComponent, type ITableCellContext, type ITableColumn, type ITableHeaderContext } from './lib/controls/table.component';
export { VerdocsOrganizationCardComponent } from './lib/controls/organization-card.component';

export { VerdocsDialogComponent } from './lib/dialogs/dialog.component';
export { VerdocsOkDialogComponent } from './lib/dialogs/ok-dialog.component';
export { VerdocsQuestionDialogComponent } from './lib/dialogs/question-dialog.component';
export { VerdocsUploadDialogComponent } from './lib/dialogs/upload-dialog.component';
export { VerdocsKbaDialogComponent, type IKbaAnswer, type IKbaIdentityDetails } from './lib/dialogs/kba-dialog.component';
export { VerdocsOtpDialogComponent } from './lib/dialogs/otp-dialog.component';
export { VerdocsPasscodeDialogComponent } from './lib/dialogs/passcode-dialog.component';
export { VerdocsDelegateDialogComponent, type IDelegateDetails } from './lib/dialogs/delegate-dialog.component';
export { VerdocsDisclosureDialogComponent } from './lib/dialogs/disclosure-dialog.component';
export { VerdocsDownloadDialogComponent, type IDownloadSelection, type TDownloadVariant } from './lib/dialogs/download-dialog.component';
export { VerdocsSigningProgressComponent, type TSigningProgressMode } from './lib/dialogs/signing-progress.component';
export { VerdocsAdoptSignatureDialogComponent, type IAdoptedSignature } from './lib/dialogs/adopt-signature-dialog.component';
export { VerdocsSignatureDialogComponent } from './lib/dialogs/signature-dialog.component';
export { VerdocsInitialDialogComponent } from './lib/dialogs/initial-dialog.component';

export { VerdocsEnvelopesService, type TUpdateEnvelopeParams, type IEnvelopesPage, type IEnvelopesQuery, type IEnvelopeQuery } from './lib/envelopes.service';
export {
  VerdocsEnvelopesListComponent,
  type TEnvelopesListView,
  type TEnvelopesSortBy,
  type IEnvelopeEvent,
} from './lib/components/envelopes/envelopes-list.component';
export { VerdocsStatusIndicatorComponent, type TIndicatorStatus, getStatusColor, getStatusMessage } from './lib/components/envelopes/status-indicator.component';
export { VerdocsEnvelopeRecipientLinkComponent } from './lib/components/envelopes/envelope-recipient-link.component';
export { VerdocsEnvelopeSidebarComponent, type IEnvelopeUpdatedEvent, type IEnvelopeRecipientEvent } from './lib/components/envelopes/envelope-sidebar.component';
export { VerdocsEnvelopeRecipientSummaryComponent } from './lib/components/envelopes/envelope-recipient-summary.component';
export { VerdocsEnvelopeUpdateRecipientComponent } from './lib/components/envelopes/envelope-update-recipient.component';
export { VerdocsContactPickerComponent, type TPickerContact, type IContactSelectEvent } from './lib/components/envelopes/contact-picker.component';
export { VerdocsSignFooterComponent } from './lib/components/envelopes/sign-footer.component';
export { VerdocsEnvelopeDocumentPageComponent } from './lib/components/envelopes/envelope-document-page.component';

export { type IFieldBaseInputs, signerClassName, fieldValue } from './lib/fields/field-base';
export { VerdocsFieldCheckboxComponent } from './lib/fields/field-checkbox.component';
export { VerdocsFieldRadioComponent } from './lib/fields/field-radio.component';
export { VerdocsFieldDropdownComponent } from './lib/fields/field-dropdown.component';
export { VerdocsFieldTextboxComponent } from './lib/fields/field-textbox.component';
export { VerdocsFieldTextareaComponent } from './lib/fields/field-textarea.component';
export { VerdocsFieldDateComponent } from './lib/fields/field-date.component';
export { VerdocsFieldTimestampComponent } from './lib/fields/field-timestamp.component';
export { VerdocsFieldAttachmentComponent } from './lib/fields/field-attachment.component';
export { VerdocsFieldSignatureComponent } from './lib/fields/field-signature.component';
export { VerdocsFieldInitialComponent } from './lib/fields/field-initial.component';
export { VerdocsFieldPaymentComponent } from './lib/fields/field-payment.component';

export { VerdocsTemplateDetailService, type IPageImageQuery, type ITemplateQuery } from './lib/template-detail.service';
export { VerdocsTemplateCardComponent } from './lib/components/templates/template-card.component';
export { VerdocsTemplateTagsComponent } from './lib/components/templates/template-tags.component';
export { VerdocsTemplateCreateComponent } from './lib/components/templates/template-create.component';
export { VerdocsTemplateSettingsComponent } from './lib/components/templates/template-settings.component';
export { VerdocsTemplateAttachmentsComponent } from './lib/components/templates/template-attachments.component';
export { VerdocsTemplateRolesComponent, type IRolesUpdatedEvent } from './lib/components/templates/template-roles.component';
export { VerdocsTemplateRolePropertiesComponent } from './lib/components/templates/template-role-properties.component';
export { VerdocsTemplateBuildTabsComponent, type TVerdocsBuildStep } from './lib/components/templates/template-build-tabs.component';
export { VerdocsTemplateDocumentPageComponent } from './lib/components/templates/template-document-page.component';
export { VerdocsTemplateFieldsComponent, type ITemplateFieldsEvent } from './lib/components/templates/template-fields.component';
export { VerdocsTemplateFieldPropertiesComponent } from './lib/components/templates/template-field-properties.component';

export { showToast, type IToastConfig } from './lib/toast';
export { SDKError, type IAuthStatus, type ITemplateEvent } from './lib/types';
