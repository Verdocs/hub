import type { IEnvelopeField, ITemplateField } from '@verdocs/js-sdk';
import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, input, output, signal, viewChild } from '@angular/core';
import { composeClasses, fieldValue, signerClassName, type IFieldBaseInputs } from './field-base';

// The legacy 24x24 default footprint. The page renderer sizes fields to their real
// boxes with inline styles; these defaults only matter when one renders standalone.
const BOX_CLASSES = 'vdocs:relative vdocs:box-border vdocs:block vdocs:w-6 vdocs:h-6 vdocs:font-sans vdocs:text-[11px]';

/**
 * An attachment field for signing. The legacy component opened an upload
 * dialog; the port goes straight to the platform file picker instead,
 * reporting the chosen File through selectFile (React's onSelectFile). The
 * remove affordance reports through deleteFile (React's onDeleteFile). Whether
 * a file is attached derives from field.value (the stored file name), so hosts
 * update the field after handling the upload. The 24px legacy box has no room
 * for a name, so it surfaces as the button tooltip.
 */
@Component({
  selector: 'verdocs-field-attachment',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'hostClasses()' },
  template: `
    @if (done()) {
      <div class="vdocs:flex vdocs:items-center vdocs:justify-center vdocs:w-6 vdocs:h-6">
        @if (hasFile()) {
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="vdocs:size-4 vdocs:text-success">
            <title>File attached</title>
            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
            <path d="M14 2v4a2 2 0 0 0 2 2h4" />
            <path d="m9 15 2 2 4-4" />
          </svg>
        } @else {
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="vdocs:size-4 vdocs:text-ink">
            <title>No file attached</title>
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        }
      </div>
    } @else {
      @if (field().label) {
        <label
          class="vdocs:absolute vdocs:-top-3.5 vdocs:-left-px vdocs:h-3.5 vdocs:px-1 vdocs:font-sans vdocs:text-[9px] vdocs:leading-[13px] vdocs:whitespace-nowrap vdocs:text-white vdocs:bg-accent-dark vdocs:rounded-t-[2px]">
          {{ field().label }}
        </label>
      }

      <button
        #pickButton
        type="button"
        [attr.title]="hasFile() ? fileName() : null"
        [attr.aria-label]="field().label || field().name"
        [disabled]="inactive()"
        [class]="buttonClasses()"
        (click)="pick()"
        (focus)="hasFocus.set(true)"
        (blur)="hasFocus.set(false)">
        @if (hasFile()) {
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
            class="vdocs:size-4 vdocs:text-success">
            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
            <path d="M14 2v4a2 2 0 0 0 2 2h4" />
            <path d="m9 15 2 2 4-4" />
          </svg>
        } @else {
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true" class="vdocs:size-4 vdocs:text-ink">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        }
      </button>

      @if (hasFile() && !inactive()) {
        <button
          type="button"
          aria-label="Remove attachment"
          class="vdocs:absolute vdocs:-top-1.5 vdocs:-right-1.5 vdocs:flex vdocs:items-center vdocs:justify-center vdocs:size-3.5 vdocs:p-0 vdocs:bg-surface vdocs:border vdocs:border-solid vdocs:border-edge vdocs:rounded-full vdocs:cursor-pointer vdocs:text-muted vdocs:hover:text-ink"
          (click)="deleteFile.emit()">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 122.881 122.88" fill="currentColor" aria-hidden="true" class="vdocs:size-2.5">
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M61.44,0c33.933,0,61.441,27.507,61.441,61.439 c0,33.933-27.508,61.44-61.441,61.44C27.508,122.88,0,95.372,0,61.439C0,27.507,27.508,0,61.44,0L61.44,0z M81.719,36.226 c1.363-1.363,3.572-1.363,4.936,0c1.363,1.363,1.363,3.573,0,4.936L66.375,61.439l20.279,20.278c1.363,1.363,1.363,3.573,0,4.937 c-1.363,1.362-3.572,1.362-4.936,0L61.44,66.376L41.162,86.654c-1.362,1.362-3.573,1.362-4.936,0c-1.363-1.363-1.363-3.573,0-4.937 l20.278-20.278L36.226,41.162c-1.363-1.363-1.363-3.573,0-4.936c1.363-1.363,3.573-1.363,4.936,0L61.44,56.504L81.719,36.226 L81.719,36.226z" />
          </svg>
        </button>
      }

      <input
        #file
        type="file"
        aria-label="Attach a file"
        [disabled]="inactive()"
        class="vdocs:sr-only"
        (change)="onFilePicked($event)" />
    }
  `,
})
export class VerdocsFieldAttachmentComponent implements IFieldBaseInputs {
  readonly field = input.required<IEnvelopeField | ITemplateField>();
  readonly disabled = input(false);
  readonly done = input(false);
  readonly focused = input(false);
  readonly signerIndex = input(0);

  /** Emitted with the chosen file when the signer picks an attachment. */
  readonly selectFile = output<File>();
  /** Emitted when the signer removes the current attachment. */
  readonly deleteFile = output<void>();

  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('file');
  private readonly pickButton = viewChild<ElementRef<HTMLButtonElement>>('pickButton');

  protected readonly hasFocus = signal(false);

  protected readonly fileName = computed(() => fieldValue(this.field()));
  protected readonly hasFile = computed(() => !!this.fileName());

  // required and readonly are boolean | null on both field shapes, so coerce
  // them before use.
  protected readonly required = computed(() => !!this.field().required);
  protected readonly inactive = computed(() => this.disabled() || !!this.field().readonly);

  protected readonly hostClasses = computed(() => {
    if (this.done()) {
      return `vdocs-field vdocs-field-done ${BOX_CLASSES}`;
    }
    return composeClasses([
      'vdocs-field',
      signerClassName(this.signerIndex()),
      BOX_CLASSES,
      this.required() && 'vdocs-field-required',
      this.disabled() && 'vdocs-field-disabled',
      // The legacy focused treatment was a ripple animation in the app-level stylesheet.
      // An accent ring gives the same cue without shipping keyframes.
      (this.focused() || this.hasFocus()) && 'vdocs-field-focused vdocs:ring-2 vdocs:ring-accent',
    ]);
  });

  protected readonly buttonClasses = computed(() => composeClasses([
    'vdocs:flex vdocs:items-center vdocs:justify-center vdocs:w-6 vdocs:h-6 vdocs:p-0 vdocs:bg-transparent vdocs:outline-none',
    'vdocs:cursor-pointer vdocs:disabled:cursor-default',
    this.required() ? 'vdocs:border vdocs:border-solid vdocs:border-danger' : 'vdocs:border-none',
    this.disabled() && 'vdocs:opacity-50',
  ]));

  constructor() {
    // Replaces the legacy focusField() imperative method: the sign flow drives
    // focus through the focused input as it walks the signer field to field.
    effect(() => {
      if (this.focused()) {
        this.pickButton()?.nativeElement.focus();
      }
    });
  }

  protected pick() {
    // Clearing before the dialog opens means re-picking the same file still fires a change event.
    const input = this.fileInput()?.nativeElement;
    if (input) {
      input.value = '';
      input.click();
    }
  }

  protected onFilePicked(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.selectFile.emit(file);
    }
  }
}
