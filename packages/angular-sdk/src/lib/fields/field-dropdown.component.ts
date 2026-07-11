import type { IEnvelopeField, ITemplateField } from '@verdocs/js-sdk';
import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, input, output, viewChild } from '@angular/core';
import { composeClasses, fieldValue, signerClassName, type IFieldBaseInputs } from './field-base';

/**
 * A dropdown signing field that lets the signer choose one of the field's
 * options. Renders the field's current value from its inputs and reports
 * selection through fieldChange: React's onFieldChange callback is this
 * component's fieldChange output, emitting the selected option's id. Builder
 * affordances (dragging, the settings popover) are not ported; see
 * docs/PORTING.md.
 */
@Component({
  selector: 'verdocs-field-dropdown',
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

      <select
        #input
        [attr.name]="field().name"
        [attr.aria-label]="field().label || field().name"
        [required]="required()"
        [disabled]="inactive()"
        [class]="selectClasses()"
        (change)="onChange($event)">
        <option value="">Select...</option>
        <!-- Selection is bound per option: binding value on the select can race
             the option elements rendering, leaving nothing selected. -->
        @for (option of options(); track option.id) {
          <option [value]="option.id" [selected]="option.id === value()">{{ option.label }}</option>
        }
        @if (!options().length) {
          <option value="NA">N/A</option>
        }
      </select>

      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
        class="vdocs:pointer-events-none vdocs:absolute vdocs:top-1/2 vdocs:right-0.5 vdocs:size-3 vdocs:-translate-y-1/2 vdocs:text-ink">
        <path
          d="M4.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747 3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0 1.615-0.406 0.418-4.695 4.502-4.695 4.502-0.217 0.223-0.502 0.335-0.787 0.335s-0.57-0.112-0.789-0.335c0 0-4.287-4.084-4.695-4.502s-0.436-1.17 0-1.615z" />
      </svg>
    }
  `,
})
export class VerdocsFieldDropdownComponent implements IFieldBaseInputs {
  readonly field = input.required<IEnvelopeField | ITemplateField>();
  readonly disabled = input(false);
  readonly done = input(false);
  readonly focused = input(false);
  readonly signerIndex = input(0);

  /** Emitted with the selected option's id when the signer picks an option. */
  readonly fieldChange = output<string>();

  private readonly select = viewChild<ElementRef<HTMLSelectElement>>('input');

  protected readonly value = computed(() => fieldValue(this.field()));

  // Envelope fields send options: null, and required/readonly are boolean |
  // null, so coerce them all before use.
  protected readonly options = computed(() => this.field().options ?? []);
  protected readonly required = computed(() => !!this.field().required);
  protected readonly inactive = computed(() => !!this.field().readonly || this.disabled());

  protected readonly hostClasses = computed(() => {
    if (this.done()) {
      return 'vdocs-field vdocs:box-border vdocs:block vdocs:h-5 vdocs:w-[85px] vdocs:font-sans vdocs:text-[11px] vdocs:font-medium vdocs:text-ink';
    }
    return composeClasses([
      'vdocs-field',
      signerClassName(this.signerIndex()),
      'vdocs:relative vdocs:box-border vdocs:block vdocs:h-5 vdocs:w-[85px] vdocs:rounded-ctl vdocs:font-sans',
      'vdocs:focus-within:ring-2 vdocs:focus-within:ring-accent',
      this.focused() && 'vdocs:ring-2 vdocs:ring-accent',
    ]);
  });

  protected readonly selectClasses = computed(() => composeClasses([
    'vdocs:absolute vdocs:inset-0 vdocs:m-0 vdocs:box-border vdocs:size-full vdocs:appearance-none vdocs:cursor-pointer',
    'vdocs:py-0 vdocs:pl-1 vdocs:pr-3.5 vdocs:text-[11px] vdocs:font-medium vdocs:text-ink vdocs:bg-transparent',
    'vdocs:border vdocs:border-solid vdocs:rounded-ctl vdocs:outline-none',
    'vdocs:disabled:opacity-50 vdocs:disabled:cursor-default',
    this.required() ? 'vdocs:border-danger' : 'vdocs:border-edge',
  ]));

  constructor() {
    // The legacy focusField() imperative method becomes the focused input: when
    // the parent flips it on, move real keyboard focus onto the select.
    effect(() => {
      if (this.focused()) {
        this.select()?.nativeElement.focus();
      }
    });
  }

  protected onChange(event: Event) {
    this.fieldChange.emit((event.target as HTMLSelectElement).value);
  }
}
