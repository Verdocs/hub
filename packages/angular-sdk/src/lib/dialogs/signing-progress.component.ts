import { isFieldFilled, type IEnvelopeField } from '@verdocs/js-sdk';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { VerdocsButtonComponent } from '../controls/button.component';

/** Which stage of the signing flow the card reflects. */
export type TSigningProgressMode = 'start' | 'signing' | 'completed';

const FIELD_TYPE_LABELS: Record<string, string> = {
  signature: 'Signature',
  initial: 'Initials',
  date: 'Date',
  textbox: 'Text Field',
  checkbox: 'Checkbox',
  radio: 'Radio Button',
  dropdown: 'Dropdown',
  attachment: 'Attachment',
  payment: 'Payment',
};

function fieldLabel(field?: IEnvelopeField) {
  if (!field) {
    return '';
  }

  const typeName = FIELD_TYPE_LABELS[field.type] || 'Field';
  return field.required ? `Required ${typeName}*` : `Optional ${typeName}`;
}

/**
 * The floating progress card shown alongside the signing experience: remaining
 * field counts, the focused field's label, and the flow controls (Start
 * Signing, Previous/Next, Submit). Progress is derived entirely from the field
 * inputs; the card keeps no state and runs no timers, so the caller advances
 * the flow in response to the events. React's onStart/onNext/onPrevious/onSubmit
 * callbacks are this component's start, next, previous, and submit outputs, and
 * its className passthrough is ordinary host classes, which Angular merges with
 * the card's default fixed placement.
 */
@Component({
  selector: 'verdocs-signing-progress',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ VerdocsButtonComponent ],
  host: {
    // The legacy card pins itself above the document viewer and disappears on
    // small screens; callers can override the placement with their own classes.
    class: 'vdocs:fixed vdocs:top-16 vdocs:left-5 vdocs:z-[900] vdocs:max-[600px]:hidden',
  },
  template: `
    <div class="vdocs:box-border vdocs:flex vdocs:w-60 vdocs:flex-col vdocs:gap-3 vdocs:rounded-lg vdocs:bg-surface vdocs:p-4 vdocs:shadow-lg vdocs:font-sans">
      @if (mode() === 'completed') {
        <div class="vdocs:flex vdocs:items-center vdocs:gap-2 vdocs:text-sm vdocs:font-medium vdocs:text-ink">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="vdocs:size-6 vdocs:shrink-0 vdocs:text-success" aria-hidden="true">
            <path
              d="M10 2C14.4183 2 18 5.58172 18 10C18 14.4183 14.4183 18 10 18C5.58172 18 2 14.4183 2 10C2 5.58172 5.58172 2 10 2ZM10 3C6.13401 3 3 6.13401 3 10C3 13.866 6.13401 17 10 17C13.866 17 17 13.866 17 10C17 6.13401 13.866 3 10 3ZM13.3584 7.64645C13.532 7.82001 13.5513 8.08944 13.4163 8.28431L13.3584 8.35355L9.35355 12.3584C9.17999 12.532 8.91056 12.5513 8.71569 12.4163L8.64645 12.3584L6.64645 10.3584C6.45118 10.1632 6.45118 9.84658 6.64645 9.65131C6.82001 9.47775 7.08944 9.45846 7.28431 9.59346L7.35355 9.65131L9 11.298L12.6513 7.64645C12.8466 7.45118 13.1632 7.45118 13.3584 7.64645Z" />
          </svg>
          Ready to Submit
        </div>
        <div class="vdocs:text-xs vdocs:leading-4 vdocs:text-muted">
          You have entered all requested signatures. Select Submit to complete the signing process.
        </div>
        <div class="vdocs:h-px vdocs:w-full vdocs:bg-edge-light"></div>
        <verdocs-button label="Submit" size="small" class="vdocs:w-full" (click)="submit.emit()" />
      } @else {
        <div class="vdocs:flex vdocs:flex-col vdocs:gap-1.5 vdocs:text-sm vdocs:text-ink">
          <div>{{ requiredRemaining() }} of {{ requiredFields().length }} required fields remaining</div>
          @if (optionalFields().length > 0) {
            <div class="vdocs:text-muted">{{ optionalRemaining() }} of {{ optionalFields().length }} optional fields remaining</div>
          }
        </div>

        @if (showReadyBody()) {
          <div class="vdocs:flex vdocs:items-center vdocs:gap-2 vdocs:text-xs vdocs:leading-4 vdocs:text-ink">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="vdocs:size-6 vdocs:shrink-0 vdocs:text-success" aria-hidden="true">
              <path
                d="M10 2C14.4183 2 18 5.58172 18 10C18 14.4183 14.4183 18 10 18C5.58172 18 2 14.4183 2 10C2 5.58172 5.58172 2 10 2ZM10 3C6.13401 3 3 6.13401 3 10C3 13.866 6.13401 17 10 17C13.866 17 17 13.866 17 10C17 6.13401 13.866 3 10 3ZM13.3584 7.64645C13.532 7.82001 13.5513 8.08944 13.4163 8.28431L13.3584 8.35355L9.35355 12.3584C9.17999 12.532 8.91056 12.5513 8.71569 12.4163L8.64645 12.3584L6.64645 10.3584C6.45118 10.1632 6.45118 9.84658 6.64645 9.65131C6.82001 9.47775 7.08944 9.45846 7.28431 9.59346L7.35355 9.65131L9 11.298L12.6513 7.64645C12.8466 7.45118 13.1632 7.45118 13.3584 7.64645Z" />
            </svg>
            Ready to submit.
          </div>
        } @else {
          <div class="vdocs:text-xs vdocs:leading-4 vdocs:text-ink">{{ focusedLabel() }}</div>
        }

        <div class="vdocs:h-px vdocs:w-full vdocs:bg-edge-light"></div>

        @if (mode() === 'start') {
          <verdocs-button label="Start Signing" size="small" class="vdocs:w-full" (click)="start.emit()" />
        } @else if (readyToSubmit()) {
          <verdocs-button label="Submit" size="small" class="vdocs:w-full" (click)="submit.emit()" />
        } @else {
          <div class="vdocs:flex vdocs:w-full vdocs:gap-3">
            <verdocs-button label="Previous" size="small" variant="outline" class="vdocs:flex-1" [disabled]="currentIndex() <= 1" (click)="previous.emit()" />
            <verdocs-button label="Next" size="small" class="vdocs:flex-1" [disabled]="currentIndex() >= fields().length" (click)="next.emit()" />
          </div>
        }
      }
    </div>
  `,
})
export class VerdocsSigningProgressComponent {
  /** The stage to render: the pre-signing prompt, in-flight progress, or the ready-to-submit card. */
  readonly mode = input<TSigningProgressMode>('start');
  /** The fillable fields for the current recipient, in signing order. */
  readonly fields = input<IEnvelopeField[]>([]);
  /** Every field for the recipient, including auto-filled ones. Grouped radio checks need the full set; defaults to fields. */
  readonly recipientFields = input<IEnvelopeField[] | null>(null);
  /** The name of the currently focused field, used to show its label and position. */
  readonly focusedField = input('');

  /** Emitted when the user clicks Start Signing. */
  readonly start = output<void>();
  /** Emitted when the user clicks Next. */
  readonly next = output<void>();
  /** Emitted when the user clicks Previous. */
  readonly previous = output<void>();
  /** Emitted when the user clicks Submit. */
  readonly submit = output<void>();

  private readonly allRecipientFields = computed(() => this.recipientFields() ?? this.fields());

  // js-sdk counts a grouped radio as filled when any member of its group is
  // selected. The legacy card layered stricter own-value checks on top for
  // dropdowns, radios, and checkboxes, and we keep its exact predicate.
  private isFilled(field: IEnvelopeField): boolean {
    return (
      !!isFieldFilled(field, this.allRecipientFields()) &&
      (field.type !== 'dropdown' || !!field.value) &&
      (field.type !== 'radio' || field.value === 'true') &&
      (field.type !== 'checkbox' || field.value === 'true')
    );
  }

  protected readonly requiredFields = computed(() => this.fields().filter(field => field.required));
  protected readonly requiredRemaining = computed(() => this.requiredFields().filter(field => !this.isFilled(field)).length);
  protected readonly optionalFields = computed(() => this.fields().filter(field => !field.required));
  protected readonly optionalRemaining = computed(() => this.optionalFields().filter(field => !this.isFilled(field)).length);

  private readonly focusedFieldObj = computed(() => this.fields().find(field => field.name === this.focusedField()));
  protected readonly currentIndex = computed(() => Math.max(1, this.fields().findIndex(field => field.name === this.focusedField()) + 1));
  protected readonly readyToSubmit = computed(() => this.requiredRemaining() === 0);
  protected readonly focusedLabel = computed(() => fieldLabel(this.focusedFieldObj()));

  protected readonly showReadyBody = computed(() => {
    const focused = this.focusedFieldObj();
    return this.mode() !== 'start' && !!focused && this.isFilled(focused) && this.readyToSubmit();
  });
}
