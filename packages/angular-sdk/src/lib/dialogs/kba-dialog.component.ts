import type { IKBAQuestion } from '@verdocs/js-sdk';
import { ChangeDetectionStrategy, Component, computed, input, linkedSignal, output, signal } from '@angular/core';
import { VerdocsSelectInputComponent, type ISelectOption } from '../controls/select-input.component';
import { VerdocsTextInputComponent } from '../controls/text-input.component';
import { VerdocsCheckboxComponent } from '../controls/checkbox.component';
import { VerdocsButtonComponent } from '../controls/button.component';
import { VerdocsDialogComponent } from './dialog.component';

// The KBA identity provider only covers US states and territories, so the list is fixed.
// The leading blank entry keeps the select controlled before the signer picks one.
const STATE_OPTIONS: ISelectOption[] = [
  { value: '', label: '' },
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AS', label: 'American Samoa' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'DC', label: 'District Of Columbia' },
  { value: 'FM', label: 'Federated States Of Micronesia' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'GU', label: 'Guam' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MH', label: 'Marshall Islands' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'MP', label: 'Northern Mariana Islands' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PW', label: 'Palau' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'PR', label: 'Puerto Rico' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VI', label: 'Virgin Islands' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
];

export interface IKbaIdentityDetails {
  /** The signer's first name. */
  first_name: string;
  /** The signer's last name. */
  last_name: string;
  /** Street address. Two-line addresses combine into a single string. */
  address: string;
  /** City. Optional for identity checks. */
  city: string;
  /** Two-letter state or territory code. Optional for identity checks. */
  state: string;
  /** Zip code. */
  zip: string;
  /** Last 4 digits of the signer's Social Security Number. */
  ssn_last_4: string;
  /** Date of birth as an ISO yyyy-mm-dd string. */
  dob: string;
}

/** One answered challenge question. React's onAnswerQuestion(questionType, choice) arguments, as an event payload. */
export interface IKbaAnswer {
  /** The type field of the question that was answered. */
  questionType: string;
  /** The choice the signer selected. */
  choice: string;
}

/**
 * The knowledge-based authentication challenge dialog. Two modes cover the KBA steps a
 * signing session can be on: 'identity' collects the signer's personal details, and
 * 'questions' steps through the multiple-choice challenge questions the identity provider
 * returned, one at a time with a step counter. Purely presentational: the sign embed
 * fetches the KBA step, supplies the questions, and wires the submitIdentity and
 * answerQuestion events back to the KBA endpoints. React's onSubmitIdentity,
 * onAnswerQuestion, and onCancel callbacks are this component's submitIdentity,
 * answerQuestion, and cancel outputs.
 */
@Component({
  selector: 'verdocs-kba-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ VerdocsDialogComponent, VerdocsButtonComponent, VerdocsTextInputComponent, VerdocsSelectInputComponent, VerdocsCheckboxComponent ],
  template: `
    <verdocs-dialog [heading]="headingTpl" [footer]="footerTpl" (closed)="cancel.emit()">
      @if (mode() === 'questions') {
        @if (helpTitle() || question()) {
          <div class="vdocs:flex vdocs:items-center vdocs:gap-4 vdocs:bg-accent-light vdocs:p-3.5 vdocs:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="vdocs:size-10 vdocs:shrink-0" aria-hidden="true">
              <path
                d="M11.925 18q.55 0 .938-.387.387-.388.387-.938 0-.55-.387-.925-.388-.375-.938-.375-.55 0-.925.375t-.375.925q0 .55.375.938.375.387.925.387Zm-.95-3.85h1.95q0-.8.2-1.287.2-.488 1.025-1.288.65-.625 1.025-1.213.375-.587.375-1.437 0-1.425-1.025-2.175Q13.5 6 12.1 6q-1.425 0-2.35.775t-1.275 1.85l1.775.7q.125-.45.55-.975.425-.525 1.275-.525.725 0 1.1.412.375.413.375.888 0 .475-.287.9-.288.425-.713.775-1.075.95-1.325 1.475-.25.525-.25 1.875ZM12 22.2q-2.125 0-3.988-.8-1.862-.8-3.237-2.175Q3.4 17.85 2.6 15.988 1.8 14.125 1.8 12t.8-3.988q.8-1.862 2.175-3.237Q6.15 3.4 8.012 2.6 9.875 1.8 12 1.8t3.988.8q1.862.8 3.237 2.175Q20.6 6.15 21.4 8.012q.8 1.863.8 3.988t-.8 3.988q-.8 1.862-2.175 3.237Q17.85 20.6 15.988 21.4q-1.863.8-3.988.8Zm0-2.275q3.325 0 5.625-2.3t2.3-5.625q0-3.325-2.3-5.625T12 4.075q-3.325 0-5.625 2.3T4.075 12q0 3.325 2.3 5.625t5.625 2.3ZM12 12Z" />
            </svg>
            <div class="vdocs:text-sm">
              @if (helpTitle()) {
                <div class="vdocs:font-semibold vdocs:mb-1">{{ helpTitle() }}</div>
              }
              @if (question(); as q) {
                <div>{{ q.prompt }}</div>
              }
            </div>
          </div>
        }

        <div class="vdocs:my-4 vdocs:grid vdocs:grid-cols-[repeat(auto-fill,minmax(100px,1fr))] vdocs:gap-4">
          @for (option of question()?.answer || []; track option) {
            <button type="button" [attr.aria-pressed]="choice() === option" [class]="optionClasses(choice() === option)" (click)="choice.set(option)">
              {{ option }}
            </button>
          }
        </div>
      } @else {
        <div class="vdocs:text-sm vdocs:font-medium vdocs:text-ink vdocs:mb-1">
          Your Name:<span class="vdocs:text-danger">*</span>
        </div>
        <div class="vdocs:grid vdocs:grid-cols-2 vdocs:gap-x-4">
          <verdocs-text-input placeholder="First name..." [value]="details().first_name" (valueChange)="setDetail('first_name', $event)" />
          <verdocs-text-input placeholder="Last name..." [value]="details().last_name" (valueChange)="setDetail('last_name', $event)" />
        </div>

        <verdocs-text-input
          label="Address"
          [required]="true"
          placeholder="Address..."
          [value]="details().address"
          (valueChange)="setDetail('address', $event)" />

        <div class="vdocs:grid vdocs:grid-cols-3 vdocs:gap-x-4">
          <verdocs-text-input label="City" placeholder="City..." [value]="details().city" (valueChange)="setDetail('city', $event)" />
          <verdocs-select-input label="State" [options]="stateOptions" [value]="details().state" (valueChange)="setDetail('state', $event)" />
          <verdocs-text-input
            label="Zip Code"
            [required]="true"
            placeholder="Zip Code..."
            [value]="details().zip"
            (valueChange)="setDetail('zip', $event)" />
        </div>

        <div class="vdocs:grid vdocs:grid-cols-2 vdocs:gap-x-4">
          <verdocs-text-input
            label="SSN Last 4"
            [required]="true"
            placeholder="Last 4 digits of your Social Security Number..."
            [value]="details().ssn_last_4"
            (valueChange)="setDetail('ssn_last_4', $event)" />

          <!-- The shared date-input control has no min/max inputs and controls are outside this
               port's scope, so we inline its markup with the DOB bounds applied. The identity
               provider needs an adult signer, hence the legacy 1920-through-18-years-ago window. -->
          <label class="vdocs:block vdocs:font-sans vdocs:mb-2.5">
            <div class="vdocs:text-sm vdocs:font-medium vdocs:text-ink vdocs:mb-1">
              Date of Birth:<span class="vdocs:text-danger">*</span>
            </div>
            <input
              type="date"
              required
              min="1920-01-01"
              [max]="dobMax"
              [value]="details().dob"
              (input)="onDobInput($event)"
              data-lpignore="true"
              class="vdocs:w-full vdocs:h-10 vdocs:px-2.5 vdocs:text-sm vdocs:text-ink vdocs:bg-surface vdocs:border vdocs:border-solid vdocs:border-edge vdocs:rounded-ctl vdocs:outline-none vdocs:focus:border-accent" />
          </label>
        </div>

        <verdocs-checkbox
          class="vdocs:my-2 vdocs:italic"
          label="I agree to provide my personal information in order to validate my identity."
          [(checked)]="agreed" />
      }
    </verdocs-dialog>

    <ng-template #headingTpl>
      Please Confirm Your Identity
      @if (mode() === 'questions' && questions().length > 1) {
        <span class="vdocs:ml-1.5 vdocs:text-muted">({{ questionIndex() + 1 }}/{{ questions().length }})</span>
      }
    </ng-template>

    <ng-template #footerTpl>
      @if (mode() === 'questions') {
        <div class="vdocs:flex vdocs:justify-end vdocs:gap-4">
          <verdocs-button label="Cancel" variant="outline" (click)="cancel.emit()" />
          <verdocs-button [label]="isLastQuestion() ? 'Submit' : 'Next'" [disabled]="!choice()" (click)="answer()" />
        </div>
      } @else {
        <div class="vdocs:flex vdocs:justify-end">
          <verdocs-button label="Submit" [disabled]="!canSubmitIdentity()" (click)="submitIdentity.emit(details())" />
        </div>
      }
    </ng-template>
  `,
})
export class VerdocsKbaDialogComponent {
  /** Which challenge to present: the identity details form, or the multiple-choice questions. */
  readonly mode = input.required<'identity' | 'questions'>();
  /** Heading for the help box shown above each question in questions mode. */
  readonly helpTitle = input('');
  /** The questions to step through in questions mode, in the shape the KBA endpoints return. */
  readonly questions = input<IKBAQuestion[]>([]);
  /** Prefills the identity form, typically from the recipient record. */
  readonly initialDetails = input<Partial<IKbaIdentityDetails>>({});

  /** Emitted in identity mode when the signer submits the completed form. The sign embed wires this to the KBA identity endpoint. */
  readonly submitIdentity = output<IKbaIdentityDetails>();
  /** Emitted in questions mode as each question is answered, the last included. The sign embed accumulates these into the KBA challenge response. */
  readonly answerQuestion = output<IKbaAnswer>();
  /** Emitted when the signer cancels via the Cancel button, the close control, or the overlay. */
  readonly cancel = output<void>();

  protected readonly stateOptions = STATE_OPTIONS;

  protected readonly details = linkedSignal<IKbaIdentityDetails>(() => ({
    first_name: this.initialDetails().first_name || '',
    last_name: this.initialDetails().last_name || '',
    address: this.initialDetails().address || '',
    city: this.initialDetails().city || '',
    state: this.initialDetails().state || '',
    zip: this.initialDetails().zip || '',
    ssn_last_4: this.initialDetails().ssn_last_4 || '',
    dob: this.initialDetails().dob || '',
  }));

  protected readonly agreed = signal(false);
  protected readonly questionIndex = signal(0);
  protected readonly choice = signal('');

  protected readonly question = computed(() => this.questions()[this.questionIndex()]);
  protected readonly isLastQuestion = computed(() => this.questionIndex() >= this.questions().length - 1);

  protected readonly canSubmitIdentity = computed(() => {
    const details = this.details();
    return (
      this.agreed() &&
      !!details.first_name &&
      !!details.last_name &&
      !!details.address &&
      !!details.zip &&
      !!details.ssn_last_4 &&
      !!details.dob
    );
  });

  protected readonly dobMax = (() => {
    const max = new Date();
    max.setFullYear(max.getFullYear() - 18);
    return max.toISOString().slice(0, 10);
  })();

  protected optionClasses(selected: boolean) {
    return (
      'vdocs:flex vdocs:h-15 vdocs:cursor-pointer vdocs:items-center vdocs:justify-center vdocs:rounded-row vdocs:border vdocs:border-solid vdocs:border-accent-light vdocs:px-1 vdocs:font-sans vdocs:text-sm vdocs:text-center ' +
      (selected ? 'vdocs:bg-accent-light vdocs:text-white' : 'vdocs:bg-transparent vdocs:text-muted')
    );
  }

  protected setDetail(field: keyof IKbaIdentityDetails, value: string) {
    this.details.update(prev => ({ ...prev, [field]: value }));
  }

  protected onDobInput(event: Event) {
    this.setDetail('dob', (event.target as HTMLInputElement).value);
  }

  protected answer() {
    const question = this.question();
    const choice = this.choice();
    if (!question || !choice) {
      return;
    }

    this.answerQuestion.emit({ questionType: question.type, choice });
    this.choice.set('');
    if (!this.isLastQuestion()) {
      this.questionIndex.update(index => index + 1);
    }
  }
}
