import type { IEnvelopeField, ITemplateField } from '@verdocs/js-sdk';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { composeClasses, fieldValue, signerClassName, type IFieldBaseInputs } from './field-base';

// The legacy 160x15 default footprint. The page renderer sizes fields to their real
// boxes with inline styles; these defaults only matter when one renders standalone.
const BOX_CLASSES = 'vdocs:relative vdocs:box-border vdocs:block vdocs:w-40 vdocs:h-[15px] vdocs:font-sans vdocs:text-[9px]';

const toDisplayTimestamp = (value: string): string => {
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
};

/**
 * A display-only timestamp field. Signers never type into these: the platform
 * stamps them when the document is submitted, so the base field inputs are the
 * entire contract and there are no outputs. The legacy component previewed the
 * current time in a permanently disabled input; a hint reads clearer, so an
 * unfilled field says what will happen instead of showing a time that is not
 * real yet.
 */
@Component({
  selector: 'verdocs-field-timestamp',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'hostClasses()' },
  template: `
    @if (done()) {
      @if (value()) {
        {{ displayTimestamp() }}
      }
    } @else {
      @if (field().label) {
        <label
          class="vdocs:absolute vdocs:-top-3.5 vdocs:-left-px vdocs:h-3.5 vdocs:px-1 vdocs:font-sans vdocs:text-[9px] vdocs:leading-[13px] vdocs:whitespace-nowrap vdocs:text-white vdocs:bg-accent-dark vdocs:rounded-t-[2px]">
          {{ field().label }}
        </label>
      }

      <!-- The 50% opacity mirrors the legacy pre-completion treatment: the value is
           provisional until the envelope is done, and the field draws full-strength then. -->
      <div
        class="vdocs:flex vdocs:items-center vdocs:w-full vdocs:h-full vdocs:box-border vdocs:px-0.5 vdocs:border vdocs:border-solid vdocs:border-ink/20 vdocs:font-medium vdocs:text-ink vdocs:opacity-50">
        {{ value() ? displayTimestamp() : field().placeholder || 'Filled at signing' }}
      </div>
    }
  `,
})
export class VerdocsFieldTimestampComponent implements IFieldBaseInputs {
  readonly field = input.required<IEnvelopeField | ITemplateField>();
  readonly disabled = input(false);
  readonly done = input(false);
  readonly focused = input(false);
  readonly signerIndex = input(0);

  protected readonly value = computed(() => fieldValue(this.field()));
  protected readonly displayTimestamp = computed(() => toDisplayTimestamp(this.value()));

  protected readonly hostClasses = computed(() => {
    if (this.done()) {
      return `vdocs-field vdocs-field-done ${BOX_CLASSES} vdocs:font-medium vdocs:text-ink`;
    }
    return composeClasses([
      'vdocs-field',
      signerClassName(this.signerIndex()),
      BOX_CLASSES,
      // The legacy scss put the required border on the host for timestamps, not the inner box.
      !!this.field().required && 'vdocs-field-required vdocs:border vdocs:border-solid vdocs:border-danger',
      this.disabled() && 'vdocs-field-disabled',
      // The legacy focused treatment was a ripple animation in the app-level stylesheet.
      // An accent ring gives the same cue without shipping keyframes.
      this.focused() && 'vdocs-field-focused vdocs:ring-2 vdocs:ring-accent',
    ]);
  });
}
