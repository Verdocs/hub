import type { IEnvelopeField, ITemplateField } from '@verdocs/js-sdk';
import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, input, output, signal, viewChild } from '@angular/core';
import { composeClasses, fieldValue, signerClassName, type IFieldBaseInputs } from './field-base';

// The legacy 150x15 default footprint. The page renderer sizes fields to their real
// boxes with inline styles; these defaults only matter when one renders standalone.
const BOX_CLASSES = 'vdocs:relative vdocs:box-border vdocs:block vdocs:w-[150px] vdocs:h-[15px] vdocs:font-sans vdocs:text-[11px]';

/**
 * A multi-line text entry field for signing. The field's value (or the
 * template default) seeds the textarea, and hosts persist edits reported
 * through fieldChange: React's onFieldChange callback is this component's
 * fieldChange output, emitting the full text after each edit. Set done to
 * render the final value as text.
 */
@Component({
  selector: 'verdocs-field-textarea',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'hostClasses()' },
  template: `
    @if (done()) {
      {{ value() }}
    } @else {
      @if (field().label) {
        <label
          class="vdocs:absolute vdocs:-top-3.5 vdocs:-left-px vdocs:h-3.5 vdocs:px-1 vdocs:font-sans vdocs:text-[9px] vdocs:leading-[13px] vdocs:whitespace-nowrap vdocs:text-white vdocs:bg-accent-dark vdocs:rounded-t-[2px]">
          {{ field().label }}
        </label>
      }

      <textarea
        #input
        [attr.name]="field().name"
        [attr.aria-label]="field().label || field().name"
        [required]="required()"
        [placeholder]="field().placeholder ?? ''"
        [disabled]="inactive()"
        [value]="value()"
        [class]="textareaClasses()"
        (input)="onInput($event)"
        (focus)="hasFocus.set(true)"
        (blur)="hasFocus.set(false)"></textarea>
    }
  `,
})
export class VerdocsFieldTextareaComponent implements IFieldBaseInputs {
  readonly field = input.required<IEnvelopeField | ITemplateField>();
  readonly disabled = input(false);
  readonly done = input(false);
  readonly focused = input(false);
  readonly signerIndex = input(0);

  /** Emitted with the full text content after each edit. */
  readonly fieldChange = output<string>();

  private readonly textarea = viewChild<ElementRef<HTMLTextAreaElement>>('input');

  protected readonly hasFocus = signal(false);

  protected readonly value = computed(() => fieldValue(this.field()));

  // required and readonly are boolean | null on both field shapes, so coerce
  // them before use.
  protected readonly required = computed(() => !!this.field().required);
  protected readonly inactive = computed(() => !!this.field().readonly || this.disabled());

  protected readonly hostClasses = computed(() => {
    if (this.done()) {
      return `vdocs-field vdocs-field-done ${BOX_CLASSES} vdocs:border vdocs:border-solid vdocs:border-ink/20 vdocs:text-ink`;
    }
    return composeClasses([
      'vdocs-field',
      signerClassName(this.signerIndex()),
      BOX_CLASSES,
      'vdocs:border vdocs:border-solid',
      this.required() ? 'vdocs-field-required vdocs:border-danger' : 'vdocs:border-ink/20',
      this.disabled() && 'vdocs-field-disabled',
      // The legacy focused treatment was a ripple animation in the app-level stylesheet.
      // An accent ring gives the same cue without shipping keyframes.
      (this.focused() || this.hasFocus()) && 'vdocs-field-focused vdocs:ring-2 vdocs:ring-accent',
    ]);
  });

  protected readonly textareaClasses = computed(() => composeClasses([
    'vdocs:block vdocs:w-full vdocs:h-full vdocs:box-border vdocs:resize-none vdocs:border-none vdocs:outline-none vdocs:bg-transparent',
    'vdocs:px-[3px] vdocs:py-0 vdocs:font-sans vdocs:text-[11px] vdocs:font-medium vdocs:text-ink',
    this.disabled() && 'vdocs:opacity-50',
  ]));

  constructor() {
    // Replaces the legacy focusField() imperative method: the sign flow drives
    // focus through the focused input as it walks the signer field to field.
    effect(() => {
      if (this.focused()) {
        this.textarea()?.nativeElement.focus();
      }
    });
  }

  protected onInput(event: Event) {
    this.fieldChange.emit((event.target as HTMLTextAreaElement).value);
  }
}
