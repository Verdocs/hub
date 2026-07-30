import { html, nothing } from 'lit';
import type { TemplateResult } from 'lit';
import type { IKBAQuestion } from '@verdocs/js-sdk';
import type { IKbaAnswer, IKbaIdentityDetails } from './dialog-events.js';
import type { ISelectOption } from '../controls/vdocs-select-input.js';
import { helpCircleIcon } from '../controls/icons/index.js';
import { VdocsElement } from '../base/vdocs-element.js';
import { register } from '../base/register.js';
import '../controls/vdocs-select-input.js';
import '../controls/vdocs-date-input.js';
import '../controls/vdocs-text-input.js';
import '../controls/vdocs-checkbox.js';
import '../controls/vdocs-button.js';
import './vdocs-dialog.js';

// The KBA identity provider only covers US states and territories, so the
// list is fixed. The leading blank entry keeps the select unset until the
// signer picks one.
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

/**
 * The knowledge-based authentication challenge dialog. Two modes cover the
 * KBA steps a signing session can be on: 'identity' collects the signer's
 * personal details, and 'questions' steps through the multiple-choice
 * challenge questions the identity provider returned, one at a time with a
 * step counter. Purely presentational: the sign embed fetches the KBA step,
 * supplies the questions, and wires vdocs-submit-identity and
 * vdocs-answer-question back to the KBA endpoints.
 *
 * React prop mapping: mode is the same-named attribute, helpTitle is
 * help-title, and questions and initialDetails are property-only. The
 * initialDetails seed is captured once, at first render.
 *
 * @fires vdocs-submit-identity - Fired in identity mode with the completed IKbaIdentityDetails in detail (React's onSubmitIdentity).
 * @fires vdocs-answer-question - Fired in questions mode as each question is answered, the last included, with an IKbaAnswer in detail
 * (React's onAnswerQuestion).
 * @fires vdocs-cancel - Fired when the signer cancels via the Cancel button, the close control, or the overlay (React's onCancel).
 */
export class VdocsKbaDialog extends VdocsElement {
  static override properties = {
    mode: { type: String },
    helpTitle: { type: String, attribute: 'help-title' },
    questions: { attribute: false },
    initialDetails: { attribute: false },
    details: { state: true },
    agreed: { state: true },
    questionIndex: { state: true },
    choice: { state: true },
  };

  /** Which challenge to present: the identity details form, or the multiple-choice questions. */
  declare mode: 'identity' | 'questions';
  /** Heading for the help box shown above each question in questions mode. */
  declare helpTitle: string;
  /** The questions to step through in questions mode, in the shape the KBA endpoints return. Property-only. */
  declare questions: IKBAQuestion[];
  /** Prefills the identity form, typically from the recipient record. Property-only. */
  declare initialDetails?: Partial<IKbaIdentityDetails>;

  private declare details: IKbaIdentityDetails;
  private declare agreed: boolean;
  private declare questionIndex: number;
  private declare choice: string;

  constructor() {
    super();
    this.mode = 'identity';
    this.helpTitle = '';
    this.questions = [];
    this.details = { first_name: '', last_name: '', address: '', city: '', state: '', zip: '', ssn_last_4: '', dob: '' };
    this.agreed = false;
    this.questionIndex = 0;
    this.choice = '';
  }

  override willUpdate() {
    // The prefill is captured once, at first render, matching the React
    // port's useState initializer: later property changes don't clobber what
    // the signer typed.
    if (!this.hasUpdated && this.initialDetails) {
      this.details = { ...this.details, ...this.initialDetails };
    }
  }

  // Footer templates run with the base dialog as their event host, so these
  // handlers are arrow properties; see vdocs-dialog.
  private handleClose = (e: Event) => {
    e.stopPropagation();
    this.emit('vdocs-cancel');
  };

  private handleCancel = () => {
    this.emit('vdocs-cancel');
  };

  private handleSubmitIdentity = () => {
    this.emit<IKbaIdentityDetails>('vdocs-submit-identity', this.details);
  };

  private handleAnswer = () => {
    const question = this.questions[this.questionIndex];
    if (!question || !this.choice) {
      return;
    }

    this.emit<IKbaAnswer>('vdocs-answer-question', { questionType: question.type, choice: this.choice });
    this.choice = '';
    if (this.questionIndex < this.questions.length - 1) {
      this.questionIndex += 1;
    }
  };

  private handleDetailInput(field: keyof IKbaIdentityDetails) {
    return (e: CustomEvent<{ value: string }>) => {
      // The composed controls' events are implementation details; the
      // dialog's public contract is vdocs-submit-identity.
      e.stopPropagation();
      this.details = { ...this.details, [field]: e.detail.value };
    };
  }

  private handleAgreeChange = (e: CustomEvent<{ checked: boolean }>) => {
    e.stopPropagation();
    this.agreed = e.detail.checked;
  };

  private renderHeading(): string | TemplateResult {
    if (this.mode === 'questions' && this.questions.length > 1) {
      return html`Please Confirm Your Identity<span class="vdocs:ml-1.5 vdocs:text-muted">(${this.questionIndex + 1}/${this.questions.length})</span>`;
    }

    return 'Please Confirm Your Identity';
  }

  private renderQuestions() {
    const question = this.questions[this.questionIndex];
    const isLastQuestion = this.questionIndex >= this.questions.length - 1;

    const footer = html`
      <div class="vdocs:flex vdocs:justify-end vdocs:gap-4">
        <vdocs-button label="Cancel" variant="outline" @click=${this.handleCancel}></vdocs-button>
        <vdocs-button label=${isLastQuestion ? 'Submit' : 'Next'} .disabled=${!this.choice} @click=${this.handleAnswer}></vdocs-button>
      </div>`;

    return html`
      <vdocs-dialog .heading=${this.renderHeading()} .footer=${footer} @vdocs-close=${this.handleClose}>
        ${this.helpTitle || question ?
          html`
            <div class="vdocs:flex vdocs:items-center vdocs:gap-4 vdocs:bg-accent-light vdocs:p-3.5 vdocs:text-white">
              ${helpCircleIcon({ className: 'vdocs:size-10 vdocs:shrink-0' })}
              <div class="vdocs:text-sm">
                ${this.helpTitle ? html`<div class="vdocs:font-semibold vdocs:mb-1">${this.helpTitle}</div>` : nothing}
                ${question ? html`<div>${question.prompt}</div>` : nothing}
              </div>
            </div>` :
          nothing}

        <div class="vdocs:my-4 vdocs:grid vdocs:grid-cols-[repeat(auto-fill,minmax(100px,1fr))] vdocs:gap-4">
          ${(question?.answer || []).map(option => html`
            <button
              type="button"
              aria-pressed=${this.choice === option}
              @click=${() => {
                this.choice = option;
              }}
              class="vdocs:flex vdocs:h-15 vdocs:cursor-pointer vdocs:items-center vdocs:justify-center vdocs:rounded-row vdocs:border vdocs:border-solid vdocs:border-accent-light vdocs:px-1 vdocs:font-sans vdocs:text-sm vdocs:text-center ${this.choice === option ?
                'vdocs:bg-accent-light vdocs:text-white' :
                'vdocs:bg-transparent vdocs:text-muted'}">
              ${option}
            </button>`)}
        </div>
      </vdocs-dialog>`;
  }

  private renderIdentity() {
    const canSubmitIdentity = this.agreed &&
      !!this.details.first_name &&
      !!this.details.last_name &&
      !!this.details.address &&
      !!this.details.zip &&
      !!this.details.ssn_last_4 &&
      !!this.details.dob;

    const footer = html`
      <div class="vdocs:flex vdocs:justify-end">
        <vdocs-button label="Submit" .disabled=${!canSubmitIdentity} @click=${this.handleSubmitIdentity}></vdocs-button>
      </div>`;

    // The legacy DOB entry bounded the picker to 1920 through 18 years ago
    // (the identity provider needs an adult signer). The shared date input
    // has no min/max pass-through, so the bounds are not enforced here; the
    // KBA provider rejects out-of-range dates server-side.
    return html`
      <vdocs-dialog .heading=${this.renderHeading()} .footer=${footer} @vdocs-close=${this.handleClose}>
        <div class="vdocs:text-sm vdocs:font-medium vdocs:text-ink vdocs:mb-1">
          Your Name:<span class="vdocs:text-danger">*</span>
        </div>
        <div class="vdocs:grid vdocs:grid-cols-2 vdocs:gap-x-4">
          <vdocs-text-input
            placeholder="First name..."
            .value=${this.details.first_name}
            @vdocs-input=${this.handleDetailInput('first_name')}></vdocs-text-input>
          <vdocs-text-input
            placeholder="Last name..."
            .value=${this.details.last_name}
            @vdocs-input=${this.handleDetailInput('last_name')}></vdocs-text-input>
        </div>

        <vdocs-text-input
          label="Address"
          required
          placeholder="Address..."
          .value=${this.details.address}
          @vdocs-input=${this.handleDetailInput('address')}></vdocs-text-input>

        <div class="vdocs:grid vdocs:grid-cols-3 vdocs:gap-x-4">
          <vdocs-text-input
            label="City"
            placeholder="City..."
            .value=${this.details.city}
            @vdocs-input=${this.handleDetailInput('city')}></vdocs-text-input>
          <vdocs-select-input
            label="State"
            .options=${STATE_OPTIONS}
            .value=${this.details.state}
            @vdocs-change=${this.handleDetailInput('state')}></vdocs-select-input>
          <vdocs-text-input
            label="Zip Code"
            required
            placeholder="Zip Code..."
            .value=${this.details.zip}
            @vdocs-input=${this.handleDetailInput('zip')}></vdocs-text-input>
        </div>

        <div class="vdocs:grid vdocs:grid-cols-2 vdocs:gap-x-4">
          <vdocs-text-input
            label="SSN Last 4"
            required
            placeholder="Last 4 digits of your Social Security Number..."
            .value=${this.details.ssn_last_4}
            @vdocs-input=${this.handleDetailInput('ssn_last_4')}></vdocs-text-input>
          <vdocs-date-input
            label="Date of Birth"
            required
            .value=${this.details.dob}
            @vdocs-input=${this.handleDetailInput('dob')}></vdocs-date-input>
        </div>

        <vdocs-checkbox
          class="vdocs:my-2 vdocs:italic"
          label="I agree to provide my personal information in order to validate my identity."
          .checked=${this.agreed}
          @vdocs-checked-change=${this.handleAgreeChange}></vdocs-checkbox>
      </vdocs-dialog>`;
  }

  override render() {
    return this.mode === 'questions' ? this.renderQuestions() : this.renderIdentity();
  }
}

register('vdocs-kba-dialog', VdocsKbaDialog);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-kba-dialog': VdocsKbaDialog;
  }
}
