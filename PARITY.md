# Component Parity

Tracks the SDK component catalog against the legacy Stencil web-sdk. The category grouping and story titles were extracted from the legacy Storybook (apps/web-sdk-storybook) before it was deleted; components that existed in `packages/web-sdk/verdocs-web-sdk/src/components` without a story are listed too, marked "no story".

Columns are the new native SDKs. Mark a cell `done` when the component is implemented, tested, and (for React) has a colocated story. `-` means not started. `frozen` means no work is allowed (star retirement discussion is Monday). Embeds are out of weekend scope; the styled apps stub them.

The React Storybook (apps/storybook) is the one catalog. Angular, Vue, and WC are documented by quickstarts and READMEs.

## Controls

| Legacy component | Story | React | Angular | Vue | WC |
| --- | --- | --- | --- | --- | --- |
| verdocs-button | Controls/Button | done | done | done | done |
| verdocs-button-panel | Controls/Button Panel | done | done | done | done |
| verdocs-checkbox | Controls/Checkbox | done | done | done | done |
| verdocs-component-error | (no story) | done | done | done | done |
| verdocs-date-input | Controls/Date Input | done | done | done | done |
| verdocs-dropdown | Controls/Dropdown | done | done | done | done |
| verdocs-file-chooser | Controls/File Chooser | done | done | done | done |
| verdocs-flag | (no story) | done | done | done | done |
| verdocs-help-icon | Controls/Help Icon | done | done | done | done |
| verdocs-loader | Controls/Loader | done | done | done | done |
| verdocs-menu-panel | Controls/Menu Panel | done | done | done | done |
| verdocs-multiselect | Controls/MultiSelect | done | done | done | done |
| verdocs-organization-card | Controls/Organization Card | done | done | done | done |
| verdocs-pagination | Controls/Pagination | done | done | done | done |
| verdocs-portal | Controls/Portal | done | done | done | done |
| verdocs-progress-bar | Controls/Progress Bar | done | done | done | done |
| verdocs-quick-filter | Controls/Quick Filter | done | done | done | done |
| verdocs-radio-button | Controls/Radio Button | done | done | done | done |
| verdocs-select-input | Controls/Select Input | done | done | done | done |
| verdocs-spinner | Controls/Spinner | done | done | done | done |
| verdocs-switch | Controls/Switch | done | done | done | done |
| verdocs-table | Controls/Table | done | done | done | done |
| verdocs-tabs | Controls/Tabs | done | done | done | done |
| verdocs-text-input | Controls/Text Input | done | done | done | done |
| verdocs-toggle | Controls/Toggle | done | done | done | done |
| verdocs-toggle-button | Controls/Toggle Button | done | done | done | done |
| verdocs-toolbar-icon | Controls/Toolbar Icon | done | done | done | done |
| (utility) Toast | Controls/Toast | done | done | done | done |

Toast is a utility function (`showToast`) in every SDK, not a component. The legacy source is `utils/Toast.ts`.

## Fields

| Legacy component | Story | React | Angular | Vue | WC |
| --- | --- | --- | --- | --- | --- |
| verdocs-field-attachment | Fields/Attachment | done | done | done | done |
| verdocs-field-checkbox | Fields/Checkbox | done | done | done | done |
| verdocs-field-date | Fields/Date | done | done | done | done |
| verdocs-field-dropdown | Fields/Dropdown | done | done | done | done |
| verdocs-field-initial | Fields/Initial | done | done | done | done |
| verdocs-field-payment | (no story) | done | done | done | done |
| verdocs-field-radio | Fields/Radio Button | done | done | done | done |
| verdocs-field-signature | Fields/Signature | done | done | done | done |
| verdocs-field-textarea | Fields/Textarea | done | done | done | done |
| verdocs-field-textbox | Fields/Textbox | done | done | done | done |
| verdocs-field-timestamp | Fields/Timestamp | done | done | done | done |

## Dialogs

| Legacy component | Story | React | Angular | Vue | WC |
| --- | --- | --- | --- | --- | --- |
| verdocs-adopt-signature-dialog | Dialogs/Adopt Signature Dialog | done | done | done | done |
| verdocs-delegate-dialog | Dialogs/Delegate Dialog | done | done | done | done |
| verdocs-dialog | Dialogs/Default | done | done | done | done |
| verdocs-disclosure-dialog | Dialogs/Disclosure Dialog | done | done | done | done |
| verdocs-download-dialog | Dialogs/Download Dialog | done | done | done | done |
| verdocs-initial-dialog | Dialogs/Initial Dialog | done | done | done | done |
| verdocs-kba-dialog | Dialogs/KBA Dialog | done | done | done | done |
| verdocs-ok-dialog | Dialogs/Ok Dialog | done | done | done | done |
| verdocs-otp-dialog | Dialogs/OTP Dialog | done | done | done | done |
| verdocs-passcode-dialog | (no story) | done | done | done | done |
| verdocs-question-dialog | Dialogs/Question Dialog | done | done | done | done |
| verdocs-signature-dialog | Dialogs/Signature Dialog | done | done | done | done |
| verdocs-signing-progress | Dialogs/Signing Progress | done | done | done | done |
| verdocs-upload-dialog | Dialogs/Upload Dialog | done | done | done | done |

## Templates

| Legacy component | Story | React | Angular | Vue | WC |
| --- | --- | --- | --- | --- | --- |
| verdocs-template-attachments | Templates/Attachments | done | done | done | done |
| verdocs-template-build-tabs | Templates/Build Tabs | done | done | done | done |
| verdocs-template-card | Templates/Template Card | done | done | done | done |
| verdocs-template-create | Templates/Create | done | done | done | done |
| verdocs-template-document-page | (no story) | done | done | done | done |
| verdocs-template-field-properties | Templates/Field Properties | done | done | done | done |
| verdocs-template-fields | Templates/Fields | done | done | done | done |
| verdocs-template-role-properties | Templates/Role Properties | done | done | done | done |
| verdocs-template-roles | Templates/Roles | done | done | done | done |
| verdocs-template-settings | Templates/Settings | done | done | done | done |
| verdocs-template-star | Templates/Template Star | frozen | frozen | frozen | frozen |
| verdocs-template-tags | Templates/Template Tags | done | done | done | done |
| verdocs-templates-list | Templates/Templates List | done | done | done | done |
| (story only) | Templates/Sender | see note | | | |

The Templates/Sender story references `verdocs-template-sender`, which does not exist anywhere in the web-sdk source. Story-only ghost; not part of the port scope. Flagged for the Monday review.

Star status: the legacy star component and the react/angular star shims exist and are frozen as-is. Starring 400s against beta (server-side bug, documented in hub/STATUS.md finding 1). No new star work in any framework.

## Envelopes

| Legacy component | Story | React | Angular | Vue | WC |
| --- | --- | --- | --- | --- | --- |
| verdocs-contact-picker | Envelopes/Contact Picker | done | done | done | done |
| verdocs-envelope-document-page | (no story) | done | done | done | done |
| verdocs-envelope-recipient-link | Envelopes/Recipient Link | done | done | done | done |
| verdocs-envelope-recipient-summary | Envelopes/Recipient Summary | done | done | done | done |
| verdocs-envelope-sidebar | Envelopes/Envelope Sidebar | done | done | done | done |
| verdocs-envelope-update-recipient | Envelopes/Update Recipient | done | done | done | done |
| verdocs-envelopes-list | Envelopes/Envelopes List | done | done | done | done |
| verdocs-sign-footer | Envelopes/Sign Footer | done | done | done | done |
| verdocs-status-indicator | Envelopes/Status Indicator | done | done | done | done |

## Embeds (out of weekend scope)

| Legacy component | Story | React | Angular | Vue | WC |
| --- | --- | --- | --- | --- | --- |
| verdocs-auth | Embeds/Auth | done | done | done | done |
| verdocs-build | Embeds/Build | - | - | - | - |
| verdocs-preview | Embeds/Preview | - | - | - | - |
| verdocs-send | Embeds/Send | - | - | - | - |
| verdocs-sign | Embeds/Sign | - | - | - | - |
| verdocs-view | Embeds/View | - | - | - | - |

Auth was ported during the POC (it behaves more like a component than an embed in the new SDKs). The remaining embeds are explicitly out of scope this weekend; styled-builder and styled-signer ship representative stubs instead.

## Elements (legacy internal, no stories)

verdocs-quick-functions, verdocs-search-box, and verdocs-search-tabs existed under `components/elements` with no stories. They are legacy internal helpers and are not part of the port scope. Revisit if a ported component turns out to need one.
