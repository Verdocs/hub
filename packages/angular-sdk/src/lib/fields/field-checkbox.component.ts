import type { IEnvelopeField, ITemplateField } from '@verdocs/js-sdk';
import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, input, output, viewChild } from '@angular/core';
import { composeClasses, fieldValue, signerClassName, type IFieldBaseInputs } from './field-base';
import { VerdocsCheckboxComponent } from '../controls/checkbox.component';

/**
 * A checkbox signing field. Renders the field's current value from its inputs
 * and reports toggles through fieldChange: React's onFieldChange callback is
 * this component's fieldChange output. Builder affordances (dragging, the
 * settings popover) are not ported; see docs/PORTING.md.
 *
 * Composes the same design-system checkbox the React field does. The control
 * has no required or aria-label pass-through, so the required treatment lives
 * entirely on the host border here.
 */
@Component({
  selector: 'verdocs-field-checkbox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ VerdocsCheckboxComponent ],
  host: { '[class]': 'hostClasses()' },
  template: `
    @if (done()) {
      <!-- The legacy done state printed a check mark or an empty box as text glyphs.
           Sources are ASCII-only, so we draw the two shapes here like the React field. -->
      <svg viewBox="0 0 16 16" fill="none" role="img" [attr.aria-label]="checked() ? 'Checked' : 'Unchecked'" class="vdocs:size-3.5">
        @if (checked()) {
          <path d="M3 8.5 6.5 12 13 4.5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
        } @else {
          <rect x="2.5" y="2.5" width="11" height="11" stroke="currentColor" stroke-width="1.5" />
        }
      </svg>
    } @else {
      @if (field().label) {
        <div
          aria-hidden="true"
          class="vdocs:absolute vdocs:-top-3.5 vdocs:left-0 vdocs:h-3.5 vdocs:px-1 vdocs:text-[9px] vdocs:leading-[13px] vdocs:whitespace-nowrap vdocs:text-white vdocs:bg-accent vdocs:rounded-t-xs">
          {{ field().label }}
        </div>
      }

      <verdocs-checkbox
        #box
        size="small"
        [name]="field().name"
        [checked]="checked()"
        [disabled]="inactive()"
        (checkedChange)="fieldChange.emit($event)" />
    }
  `,
})
export class VerdocsFieldCheckboxComponent implements IFieldBaseInputs {
  readonly field = input.required<IEnvelopeField | ITemplateField>();
  readonly disabled = input(false);
  readonly done = input(false);
  readonly focused = input(false);
  readonly signerIndex = input(0);

  /** Emitted with the new checked state when the signer toggles the box. */
  readonly fieldChange = output<boolean>();

  private readonly box = viewChild<VerdocsCheckboxComponent, ElementRef<HTMLElement>>('box', { read: ElementRef });

  protected readonly checked = computed(() => fieldValue(this.field()) === 'true');

  // readonly is boolean | null on both field shapes, so coerce before mixing it
  // with the disabled input.
  protected readonly inactive = computed(() => !!this.field().readonly || this.disabled());

  protected readonly hostClasses = computed(() => {
    if (this.done()) {
      return 'vdocs-field vdocs:box-border vdocs:block vdocs:size-4 vdocs:font-sans vdocs:text-ink';
    }
    return composeClasses([
      'vdocs-field',
      signerClassName(this.signerIndex()),
      'vdocs:relative vdocs:box-border vdocs:block vdocs:size-4 vdocs:font-sans',
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
}
