import type { IEnvelopeField, ITemplateField } from '@verdocs/js-sdk';
import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, input, output, viewChild } from '@angular/core';
import { composeClasses, fieldValue, signerClassName, type IFieldBaseInputs } from './field-base';

/**
 * A single-line text signing field. Renders the field's current value from its
 * inputs and reports edits through fieldChange: React's onFieldChange callback
 * is this component's fieldChange output, emitting the full new text after
 * every keystroke. The legacy component switched to a textarea for multiline
 * fields; that mode is the textarea field's job here. Builder affordances
 * (dragging, resizing, the settings popover) are not ported; see
 * docs/PORTING.md.
 */
@Component({
  selector: 'verdocs-field-textbox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'hostClasses()' },
  template: `
    @if (done()) {
      {{ value() }}
    } @else {
      @if (field().label) {
        <div
          aria-hidden="true"
          class="vdocs:absolute vdocs:-top-3.5 vdocs:left-0 vdocs:h-3.5 vdocs:px-1 vdocs:text-[9px] vdocs:leading-[13px] vdocs:whitespace-nowrap vdocs:text-white vdocs:bg-accent vdocs:rounded-t-xs">
          {{ field().label }}
        </div>
      }

      <input
        #input
        type="text"
        [attr.name]="field().name"
        [attr.aria-label]="field().label || field().name"
        [value]="value()"
        [attr.maxlength]="maxLength()"
        [placeholder]="field().placeholder ?? ''"
        [required]="required()"
        [disabled]="inactive()"
        data-lpignore="true"
        [class]="inputClasses()"
        (input)="onInput($event)" />
    }
  `,
})
export class VerdocsFieldTextboxComponent implements IFieldBaseInputs {
  readonly field = input.required<IEnvelopeField | ITemplateField>();
  readonly disabled = input(false);
  readonly done = input(false);
  readonly focused = input(false);
  readonly signerIndex = input(0);

  /** Emitted with the full new text after every keystroke. */
  readonly fieldChange = output<string>();

  private readonly textInput = viewChild<ElementRef<HTMLInputElement>>('input');

  protected readonly value = computed(() => fieldValue(this.field()));

  // required and readonly are boolean | null on both field shapes, so coerce
  // them before use.
  protected readonly required = computed(() => !!this.field().required);
  protected readonly inactive = computed(() => !!this.field().readonly || this.disabled());

  // Carried over from the legacy component: the field's pixel width caps how
  // many characters fit, at roughly 5px per character.
  protected readonly maxLength = computed(() => Math.floor((this.field().width ?? 150) / 5));

  protected readonly hostClasses = computed(() => {
    if (this.done()) {
      return 'vdocs-field vdocs:box-border vdocs:block vdocs:h-[15px] vdocs:w-[150px] vdocs:font-sans vdocs:text-[11px] vdocs:font-medium ' +
        'vdocs:tracking-[-0.2px] vdocs:text-ink';
    }
    return composeClasses([
      'vdocs-field',
      signerClassName(this.signerIndex()),
      'vdocs:relative vdocs:box-border vdocs:block vdocs:h-[15px] vdocs:w-[150px] vdocs:rounded-ctl vdocs:font-sans vdocs:tracking-[-0.2px]',
      'vdocs:border vdocs:border-solid',
      'vdocs:focus-within:ring-2 vdocs:focus-within:ring-accent',
      this.required() ? 'vdocs:border-danger' : 'vdocs:border-edge',
      this.focused() && 'vdocs:ring-2 vdocs:ring-accent',
    ]);
  });

  protected readonly inputClasses = computed(() => composeClasses([
    'vdocs:absolute vdocs:inset-0 vdocs:m-0 vdocs:box-border vdocs:size-full',
    'vdocs:border-none vdocs:outline-none vdocs:bg-transparent',
    'vdocs:py-0 vdocs:px-[3px] vdocs:font-medium vdocs:text-ink',
    'vdocs:disabled:opacity-50',
    // The legacy field dropped to a smaller font when the field box was drawn small.
    (this.field().height ?? 15) < 15 ? 'vdocs:text-[8px]' : 'vdocs:text-[11px]',
  ]));

  constructor() {
    // The legacy focusField() imperative method becomes the focused input: when
    // the parent flips it on, move real keyboard focus onto the input.
    effect(() => {
      if (this.focused()) {
        this.textInput()?.nativeElement.focus();
      }
    });
  }

  protected onInput(event: Event) {
    this.fieldChange.emit((event.target as HTMLInputElement).value);
  }
}
