import type { IEnvelopeField, ITemplateField } from '@verdocs/js-sdk';
import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, input, output, viewChild } from '@angular/core';
import { composeClasses, fieldValue, signerClassName, type IFieldBaseInputs } from './field-base';
import { VerdocsRadioButtonComponent } from '../controls/radio-button.component';

// The legacy done state inlined these two Material circle glyphs as SVG
// strings; they live here like they do in the React field.
const SELECTED_PATH = 'M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0-5C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 ' +
  '0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z';
const UNSELECTED_PATH = 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z';

/**
 * A radio button signing field. Each field is a single button; buttons sharing
 * the same group form an exclusive set. Renders the field's current value from
 * its inputs and reports selection through fieldChange: React's onFieldChange
 * callback is this component's fieldChange output, emitting this option's id
 * (the field name). Builder affordances (dragging, the settings popover, the
 * group tag) are not ported; see docs/PORTING.md.
 *
 * Composes the same design-system radio button the React field does. The
 * control has no required or aria-label pass-through, so the required
 * treatment lives entirely on the host border here.
 */
@Component({
  selector: 'verdocs-field-radio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ VerdocsRadioButtonComponent ],
  host: { '[class]': 'hostClasses()' },
  template: `
    @if (done()) {
      <svg viewBox="0 0 24 24" fill="currentColor" role="img" [attr.aria-label]="selected() ? 'Selected' : 'Not selected'" class="vdocs:size-2.5">
        <path [attr.d]="selected() ? selectedPath : unselectedPath" />
      </svg>
    } @else {
      @if (field().label) {
        <div
          aria-hidden="true"
          class="vdocs:absolute vdocs:-top-3.5 vdocs:left-0 vdocs:h-3.5 vdocs:px-1 vdocs:text-[9px] vdocs:leading-[13px] vdocs:whitespace-nowrap vdocs:text-white vdocs:bg-accent vdocs:rounded-t-xs">
          {{ field().label }}
        </div>
      }

      <verdocs-radio-button
        #box
        [name]="field().group || field().name"
        [checked]="selected()"
        [disabled]="inactive()"
        (checkedChange)="onChecked($event)" />
    }
  `,
})
export class VerdocsFieldRadioComponent implements IFieldBaseInputs {
  readonly field = input.required<IEnvelopeField | ITemplateField>();
  readonly disabled = input(false);
  readonly done = input(false);
  readonly focused = input(false);
  readonly signerIndex = input(0);

  /** Emitted with this option's id (the field name) when the signer selects it. */
  readonly fieldChange = output<string>();

  private readonly box = viewChild<VerdocsRadioButtonComponent, ElementRef<HTMLElement>>('box', { read: ElementRef });

  protected readonly selectedPath = SELECTED_PATH;
  protected readonly unselectedPath = UNSELECTED_PATH;

  protected readonly selected = computed(() => fieldValue(this.field()) === 'true');

  // readonly is boolean | null on both field shapes, so coerce before mixing it
  // with the disabled input.
  protected readonly inactive = computed(() => !!this.field().readonly || this.disabled());

  protected readonly hostClasses = computed(() => {
    if (this.done()) {
      return 'vdocs-field vdocs:box-border vdocs:block vdocs:size-2.5 vdocs:font-sans vdocs:text-ink';
    }
    return composeClasses([
      'vdocs-field',
      signerClassName(this.signerIndex()),
      'vdocs:relative vdocs:box-border vdocs:block vdocs:size-4 vdocs:rounded-full vdocs:font-sans',
      'vdocs:focus-within:ring-2 vdocs:focus-within:ring-accent',
      !!this.field().required && 'vdocs:border vdocs:border-solid vdocs:border-danger',
      this.focused() && 'vdocs:ring-2 vdocs:ring-accent',
    ]);
  });

  constructor() {
    // The legacy focusField() imperative method becomes the focused input: when
    // the parent flips it on, move real keyboard focus onto the control's
    // native input. The control has no focus API, so we reach into its DOM.
    effect(() => {
      if (this.focused()) {
        this.box()?.nativeElement.querySelector('input')?.focus();
      }
    });
  }

  protected onChecked(checked: boolean) {
    // The browser fires no change event on the button a selection moves away
    // from, so only a newly-selected button reports.
    if (checked) {
      this.fieldChange.emit(this.field().name);
    }
  }
}
