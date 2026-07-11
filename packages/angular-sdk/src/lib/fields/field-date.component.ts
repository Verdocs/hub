import type { IEnvelopeField, ITemplateField } from '@verdocs/js-sdk';
import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, input, output, signal, viewChild } from '@angular/core';
import { composeClasses, fieldValue, signerClassName, type IFieldBaseInputs } from './field-base';

// The legacy 74x20 default footprint. The page renderer sizes fields to their real
// boxes with inline styles; these defaults only matter when one renders standalone.
const BOX_CLASSES = 'vdocs:relative vdocs:box-border vdocs:block vdocs:w-[74px] vdocs:h-5 vdocs:font-sans vdocs:text-[11px] vdocs:tracking-[0.3px]';

// Stored values may be date-only strings or full ISO timestamps. The native date input
// only accepts yyyy-mm-dd, so we trim ISO strings and fall back to parsing anything else
// with local date parts (round-tripping through toISOString would shift days across
// timezones).
const toInputDate = (value: string): string => {
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  const parsed = new Date(value);
  if (isNaN(parsed.getTime())) {
    return '';
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
};

// Date-only strings parse as UTC midnight, so calling toLocaleDateString on the parsed
// Date would show the previous day in negative-offset timezones. Building the Date from
// its parts keeps the displayed date the one the signer picked.
const toDisplayDate = (value: string): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(toInputDate(value));
  if (!match) {
    return value;
  }
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])).toLocaleDateString();
};

/**
 * A date entry field for signing. The legacy component embedded the
 * air-datepicker widget; like the date input control, we lean on the platform
 * picker (input type="date") instead: no dependency, and a stable yyyy-mm-dd
 * value format. Native date inputs ignore placeholder text, so the legacy
 * "Date..." placeholder is dropped. React's onFieldChange callback is this
 * component's fieldChange output, emitting the picked date as an ISO
 * yyyy-mm-dd string (empty when cleared).
 */
@Component({
  selector: 'verdocs-field-date',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'hostClasses()' },
  template: `
    @if (done()) {
      {{ displayDate() }}
    } @else {
      @if (field().label) {
        <label
          class="vdocs:absolute vdocs:-top-3.5 vdocs:left-0 vdocs:h-3.5 vdocs:px-1 vdocs:font-sans vdocs:text-[9px] vdocs:leading-[13px] vdocs:whitespace-nowrap vdocs:text-white vdocs:bg-accent-dark vdocs:rounded-t-[2px]">
          {{ field().label }}
        </label>
      }

      <input
        #input
        type="date"
        [attr.name]="field().name"
        [attr.aria-label]="field().label || field().name"
        [required]="required()"
        [disabled]="inactive()"
        [value]="inputDate()"
        [class]="inputClasses()"
        (input)="onInput($event)"
        (focus)="hasFocus.set(true)"
        (blur)="hasFocus.set(false)" />
    }
  `,
})
export class VerdocsFieldDateComponent implements IFieldBaseInputs {
  readonly field = input.required<IEnvelopeField | ITemplateField>();
  readonly disabled = input(false);
  readonly done = input(false);
  readonly focused = input(false);
  readonly signerIndex = input(0);

  /** Emitted with the picked date as an ISO yyyy-mm-dd string, empty when cleared. */
  readonly fieldChange = output<string>();

  private readonly dateInput = viewChild<ElementRef<HTMLInputElement>>('input');

  protected readonly hasFocus = signal(false);

  protected readonly inputDate = computed(() => toInputDate(fieldValue(this.field())));
  protected readonly displayDate = computed(() => toDisplayDate(fieldValue(this.field())));

  // required and readonly are boolean | null on both field shapes, so coerce
  // them before use.
  protected readonly required = computed(() => !!this.field().required);
  protected readonly inactive = computed(() => !!this.field().readonly || this.disabled());

  protected readonly hostClasses = computed(() => {
    if (this.done()) {
      return `vdocs-field vdocs-field-done ${BOX_CLASSES} vdocs:font-medium vdocs:text-ink`;
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

  protected readonly inputClasses = computed(() => {
    // The legacy field dropped to a smaller font when the field box was drawn small.
    const small = (this.field().width ?? 74) < 74 || (this.field().height ?? 20) < 20;
    return composeClasses([
      'vdocs:block vdocs:w-full vdocs:h-full vdocs:box-border vdocs:appearance-none vdocs:outline-none vdocs:bg-transparent',
      'vdocs:font-sans vdocs:font-medium vdocs:text-ink vdocs:border vdocs:border-solid',
      this.required() ? 'vdocs:border-danger' : 'vdocs:border-edge-light',
      small ? 'vdocs:text-[7px]' : 'vdocs:text-xs',
      this.disabled() && 'vdocs:opacity-50',
    ]);
  });

  constructor() {
    // Replaces the legacy focusField() imperative method: the sign flow drives
    // focus through the focused input as it walks the signer field to field.
    effect(() => {
      if (this.focused()) {
        this.dateInput()?.nativeElement.focus();
      }
    });
  }

  protected onInput(event: Event) {
    this.fieldChange.emit((event.target as HTMLInputElement).value);
  }
}
