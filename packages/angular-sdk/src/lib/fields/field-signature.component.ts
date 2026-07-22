import type { IEnvelopeField, ITemplateField } from '@verdocs/js-sdk';
import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, input, output, viewChild } from '@angular/core';
import { composeClasses, signerClassName, type IFieldBaseInputs } from './field-base';

const BOX_CLASSES = 'vdocs:font-sans vdocs:relative vdocs:box-border vdocs:block vdocs:w-[83px] vdocs:h-9 vdocs:text-[11px] vdocs:tracking-[0.3px] ' +
  'vdocs:scroll-my-5';

const IMAGE_CLASSES = 'vdocs:block vdocs:h-full vdocs:w-auto vdocs:max-w-none';

/**
 * Displays a signature field. Unsigned, it renders the "Signature" affordance
 * and reports clicks through beginSigning (React's onBeginSigning) so the
 * caller can run the adopt-a-signature flow. Once signed (signatureUrl set) or
 * done, the adopted image is drawn sized to the field box.
 *
 * The legacy component fetched the signature blob by ID itself. Here the
 * caller resolves the image and passes a URL; the sign embed will own that
 * lookup, along with the legacy Edit/Clear menu on a signed field. Builder
 * affordances (drag, resize, the settings popover) are omitted per
 * docs/PORTING.md.
 */
@Component({
  selector: 'verdocs-field-signature',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'hostClasses()' },
  template: `
    @if (done()) {
      @if (signatureUrl()) {
        <img [class]="imageClasses" [src]="signatureUrl()" alt="Signature" />
      }
    } @else {
      @if (field().label) {
        <!-- The legacy chip was a bare label element; a span avoids implying a form
             association that does not exist. -->
        <span
          class="vdocs:absolute vdocs:-top-3.5 vdocs:-left-px vdocs:h-3.5 vdocs:px-1 vdocs:text-[9px] vdocs:leading-[13px] vdocs:text-white vdocs:bg-[#4a4a99] vdocs:rounded-t-[2px]">
          {{ field().label }}
        </span>
      }

      @if (signed()) {
        <div class="vdocs:relative vdocs:size-full" [class.vdocs:opacity-50]="disabled()" [class.vdocs:pointer-events-none]="disabled()">
          <img [class]="imageClasses" [src]="signatureUrl()" alt="Signature" />
        </div>
      } @else {
        <button
          #affordance
          type="button"
          [disabled]="disabled()"
          (click)="beginSigning.emit()"
          class="vdocs:box-border vdocs:size-full vdocs:p-0 vdocs:bg-transparent vdocs:border-none vdocs:font-sans vdocs:font-medium vdocs:text-[11px] vdocs:text-[rgba(0,0,0,0.87)] vdocs:cursor-pointer vdocs:disabled:cursor-default">
          Signature
        </button>
      }
    }
  `,
})
export class VerdocsFieldSignatureComponent implements IFieldBaseInputs {
  readonly field = input.required<IEnvelopeField | ITemplateField>();
  readonly disabled = input(false);
  readonly done = input(false);
  readonly focused = input(false);
  readonly signerIndex = input(0);

  /** Resolved URL for the adopted signature image (a data:, blob:, or https: URL). */
  readonly signatureUrl = input('');

  /** Emitted when the user clicks the unsigned field to start the adopt-a-signature flow. */
  readonly beginSigning = output<void>();

  private readonly affordance = viewChild<ElementRef<HTMLButtonElement>>('affordance');

  protected readonly imageClasses = IMAGE_CLASSES;

  protected readonly signed = computed(() => !!this.signatureUrl());

  protected readonly hostClasses = computed(() => {
    if (this.done()) {
      return `vdocs-field vdocs-done ${BOX_CLASSES}`;
    }
    const signed = this.signed();
    const required = !!this.field().required;
    return composeClasses([
      'vdocs-field',
      required && 'vdocs-required',
      this.disabled() && 'vdocs-disabled',
      this.focused() && 'vdocs-focused',
      signed && 'vdocs-filled',
      signerClassName(this.signerIndex()),
      BOX_CLASSES,
      'vdocs:cursor-pointer',
      // Signed fields drop their border and background so only the image shows. The signer
      // class stays on the element as a white-label hook; bg-transparent outranks it because
      // the utilities layer comes after components, standing in for the legacy .filled !important.
      signed ?
        'vdocs:bg-transparent' :
        `vdocs:border vdocs:border-solid ${required ? 'vdocs:border-danger' : 'vdocs:border-[rgba(0,0,0,0.2)]'}`,
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
