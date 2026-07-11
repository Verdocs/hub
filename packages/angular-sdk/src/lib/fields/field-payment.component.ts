import type { IEnvelopeField, ITemplateField } from '@verdocs/js-sdk';
import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, input, output, viewChild } from '@angular/core';
import { composeClasses, signerClassName, type IFieldBaseInputs } from './field-base';

const BOX_CLASSES = 'vdocs:font-sans vdocs:relative vdocs:box-border vdocs:block vdocs:size-6 vdocs:text-[11px] vdocs:scroll-my-5 vdocs:border ' +
  'vdocs:border-solid vdocs:border-[#ccffaa]';

/**
 * Displays a payment field. Unpaid, it renders a dollar-sign affordance and
 * reports clicks through beginPayment (React's onBeginPayment) so the caller
 * can run the payment flow; paid or done, it renders a dollar-and-check
 * "collected" treatment.
 *
 * This is a representative display port. The legacy component carried
 * vestigial payment plumbing with no provider integration: recipient lists
 * feeding a prepared-by message that never rendered, and a stamp image that
 * was never populated. Collecting a payment belongs to the sign embed era, so
 * none of that is ported. Builder affordances (drag, resize, the settings
 * popover) are omitted per docs/PORTING.md.
 */
@Component({
  selector: 'verdocs-field-payment',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'hostClasses()' },
  template: `
    @if (done() || paid()) {
      <!-- The legacy component drew "$" plus a check character once payment was collected. We
           keep the treatment but draw the check as an icon so the glyph scales with the box. -->
      <span
        role="img"
        aria-label="Paid"
        class="vdocs:flex vdocs:size-full vdocs:items-center vdocs:justify-center vdocs:gap-px vdocs:font-medium vdocs:text-[rgba(0,0,0,0.87)]">
        $
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" aria-hidden="true" class="vdocs:size-3">
          <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      </span>
    } @else {
      <button
        #affordance
        type="button"
        [disabled]="disabled()"
        (click)="beginPayment.emit()"
        aria-label="Payment"
        class="vdocs:box-border vdocs:size-full vdocs:p-0 vdocs:bg-transparent vdocs:border-none vdocs:font-sans vdocs:font-medium vdocs:text-[11px] vdocs:text-[rgba(0,0,0,0.87)] vdocs:cursor-pointer vdocs:disabled:cursor-default">
        $
      </button>
    }
  `,
})
export class VerdocsFieldPaymentComponent implements IFieldBaseInputs {
  readonly field = input.required<IEnvelopeField | ITemplateField>();
  readonly disabled = input(false);
  readonly done = input(false);
  readonly focused = input(false);
  readonly signerIndex = input(0);

  /** Render the payment-collected treatment instead of the payment affordance. */
  readonly paid = input(false);

  /** Emitted when the user clicks the unpaid field to start the payment flow. */
  readonly beginPayment = output<void>();

  private readonly affordance = viewChild<ElementRef<HTMLButtonElement>>('affordance');

  protected readonly hostClasses = computed(() => {
    if (this.done()) {
      return `vdocs-field vdocs-done ${BOX_CLASSES}`;
    }
    return composeClasses([
      'vdocs-field',
      this.field().required && 'vdocs-required',
      this.disabled() && 'vdocs-disabled',
      this.focused() && 'vdocs-focused',
      this.paid() && 'vdocs-filled',
      signerClassName(this.signerIndex()),
      BOX_CLASSES,
      'vdocs:cursor-pointer',
      this.disabled() && 'vdocs:opacity-50',
    ]);
  });

  constructor() {
    // Replaces the legacy focusField() imperative method: the sign flow drives
    // focus through the focused input as it walks the signer field to field.
    effect(() => {
      if (this.focused()) {
        this.affordance()?.nativeElement.focus();
      }
    });
  }
}
