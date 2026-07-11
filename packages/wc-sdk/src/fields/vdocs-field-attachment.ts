import { html, nothing } from 'lit';
import type { PropertyValues } from 'lit';
import type { IEnvelopeField, ITemplateField } from '@verdocs/js-sdk';
import { fieldValue, signerClassName, syncFieldClasses, type IFieldBaseProperties } from './field-base.js';
import { clearIcon, fileCheckIcon, paperclipIcon } from '../controls/icons/index.js';
import { VdocsElement } from '../base/vdocs-element.js';
import { register } from '../base/register.js';

// The legacy 24x24 default footprint. The page renderer sizes fields to their
// real boxes with inline styles; these defaults only matter when one renders
// standalone.
const BOX_CLASSES = 'vdocs:relative vdocs:box-border vdocs:block vdocs:w-6 vdocs:h-6 vdocs:font-sans vdocs:text-[11px]';

const labelChip = (label: string) => html`
  <label
    class="vdocs:absolute vdocs:-top-3.5 vdocs:-left-px vdocs:h-3.5 vdocs:px-1 vdocs:font-sans vdocs:text-[9px] vdocs:leading-[13px] vdocs:whitespace-nowrap vdocs:text-white vdocs:bg-accent-dark vdocs:rounded-t-[2px]">
    ${label}
  </label>`;

/**
 * An attachment field for signing. The legacy component opened an upload
 * dialog; the port goes straight to the platform file picker instead,
 * reporting the chosen File through vdocs-select-file (React's onSelectFile
 * callback) and removals through vdocs-delete-file (React's onDeleteFile).
 * Whether a file is attached derives from field.value (the stored file name),
 * so hosts update the field after handling the upload. The 24px legacy box
 * has no room for a name, so it surfaces as the button tooltip.
 *
 * @fires vdocs-select-file - Fired when the signer picks an attachment, with the chosen File in detail.file.
 * @fires vdocs-delete-file - Fired when the signer removes the current attachment.
 */
export class VdocsFieldAttachment extends VdocsElement implements IFieldBaseProperties {
  static override properties = {
    field: { attribute: false },
    disabled: { type: Boolean },
    done: { type: Boolean },
    focused: { type: Boolean },
    signerIndex: { type: Number, attribute: 'signer-index' },
    hasFocus: { state: true },
  };

  /** The field to render. Template fields render defaults; envelope fields render live values. Property-only. */
  declare field?: IEnvelopeField | ITemplateField;
  /** Disable input regardless of the field's own readonly state (preview modes). */
  declare disabled: boolean;
  /** Render the display-final-value state (signing is complete for this field). */
  declare done: boolean;
  /** Draw the focused treatment and move keyboard focus onto the inner button. */
  declare focused: boolean;
  /** Zero-based recipient index, used for the vdocs-signer-N background class. */
  declare signerIndex: number;

  private declare hasFocus: boolean;

  constructor() {
    super();
    this.disabled = false;
    this.done = false;
    this.focused = false;
    this.signerIndex = 0;
    this.hasFocus = false;
  }

  override updated(changed: PropertyValues<this>) {
    const field = this.field;
    if (!field) {
      return;
    }

    if (this.done) {
      syncFieldClasses(this, [ 'vdocs-field vdocs-field-done', BOX_CLASSES ]);
      return;
    }

    syncFieldClasses(this, [
      'vdocs-field',
      signerClassName(this.signerIndex),
      BOX_CLASSES,
      field.required && 'vdocs-field-required',
      this.disabled && 'vdocs-field-disabled',
      // The legacy focused treatment was a ripple animation in the app-level
      // stylesheet. An accent ring gives the same cue without shipping
      // keyframes.
      (this.focused || this.hasFocus) && 'vdocs-field-focused vdocs:ring-2 vdocs:ring-accent',
    ]);

    // Replaces the legacy focusField() imperative method: the sign flow drives
    // focus through the focused property as it walks the signer along.
    if (changed.has('focused') && this.focused) {
      this.querySelector('button')?.focus();
    }
  }

  private handlePick() {
    const picker = this.querySelector<HTMLInputElement>('input[type="file"]');
    if (picker) {
      // Clearing before the dialog opens means re-picking the same file still
      // fires change.
      picker.value = '';
      picker.click();
    }
  }

  private handleFile(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      this.emit<{ file: File }>('vdocs-select-file', { file });
    }
  }

  private handleDelete() {
    this.emit('vdocs-delete-file');
  }

  private handleFocus() {
    this.hasFocus = true;
  }

  private handleBlur() {
    this.hasFocus = false;
  }

  override render() {
    const field = this.field;
    if (!field) {
      // Custom elements can be created before their properties are assigned;
      // render nothing until the field arrives.
      return nothing;
    }

    const fileName = fieldValue(field);
    const hasFile = !!fileName;

    if (this.done) {
      return html`
        <div class="vdocs:flex vdocs:items-center vdocs:justify-center vdocs:w-6 vdocs:h-6">
          ${hasFile ?
              fileCheckIcon({ className: 'vdocs:size-4 vdocs:text-success', title: 'File attached' }) :
              paperclipIcon({ className: 'vdocs:size-4 vdocs:text-ink', title: 'No file attached' })}
        </div>`;
    }

    const label = field.label ?? '';
    const required = !!field.required;
    const inactive = this.disabled || !!field.readonly;

    return html`
      ${label ? labelChip(label) : nothing}
      <button
        type="button"
        title=${hasFile ? fileName : nothing}
        aria-label=${label || field.name}
        ?disabled=${inactive}
        @click=${this.handlePick}
        @focus=${this.handleFocus}
        @blur=${this.handleBlur}
        class="vdocs:flex vdocs:items-center vdocs:justify-center vdocs:w-6 vdocs:h-6 vdocs:p-0 vdocs:bg-transparent vdocs:outline-none vdocs:cursor-pointer vdocs:disabled:cursor-default ${required ? 'vdocs:border vdocs:border-solid vdocs:border-danger' : 'vdocs:border-none'}${this.disabled ? ' vdocs:opacity-50' : ''}">
        ${hasFile ?
            fileCheckIcon({ className: 'vdocs:size-4 vdocs:text-success' }) :
            paperclipIcon({ className: 'vdocs:size-4 vdocs:text-ink' })}
      </button>
      ${hasFile && !inactive ?
        html`
          <button
            type="button"
            aria-label="Remove attachment"
            @click=${this.handleDelete}
            class="vdocs:absolute vdocs:-top-1.5 vdocs:-right-1.5 vdocs:flex vdocs:items-center vdocs:justify-center vdocs:size-3.5 vdocs:p-0 vdocs:bg-surface vdocs:border vdocs:border-solid vdocs:border-edge vdocs:rounded-full vdocs:cursor-pointer vdocs:text-muted vdocs:hover:text-ink">
            ${clearIcon({ className: 'vdocs:size-2.5' })}
          </button>` :
        nothing}
      <input
        type="file"
        aria-label="Attach a file"
        ?disabled=${inactive}
        class="vdocs:sr-only"
        @change=${this.handleFile} />`;
  }
}

register('vdocs-field-attachment', VdocsFieldAttachment);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-field-attachment': VdocsFieldAttachment;
  }

  interface GlobalEventHandlersEventMap {
    'vdocs-select-file': CustomEvent<{ file: File }>;
    'vdocs-delete-file': CustomEvent<undefined>;
  }
}
