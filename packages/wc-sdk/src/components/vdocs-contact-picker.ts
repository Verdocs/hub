import { html, nothing } from 'lit';
import { live } from 'lit/directives/live.js';
import { createRef, ref } from 'lit/directives/ref.js';
import type { PropertyValues, TemplateResult } from 'lit';
import { formatFullName, isValidEmail } from '@verdocs/js-sdk';
import type { IProfile, IRecipient, TRecipientAuthMethod } from '@verdocs/js-sdk';
import { VdocsElement } from '../base/vdocs-element.js';
import { register } from '../base/register.js';
import '../controls/vdocs-checkbox.js';
import '../controls/vdocs-button.js';
import '../controls/vdocs-portal.js';

/** A contact suggestion, typically a recent recipient or an address-book entry. */
export type TPickerContact = Partial<IProfile>;

/** The completed recipient details, reported through vdocs-submit-contact. */
export interface IContactSelectEvent {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  message: string;
  delegator: boolean;
  name_locked: boolean;
  auth_methods: TRecipientAuthMethod[];
  passcode: string;
}

const LABEL_CLASSES = 'vdocs:flex vdocs:flex-[0_0_80px] vdocs:pt-1.5 vdocs:text-[13px] vdocs:font-medium vdocs:text-muted';

const INPUT_CLASSES = 'vdocs:min-w-0 vdocs:flex-1 vdocs:box-border vdocs:rounded-ctl vdocs:border vdocs:border-solid vdocs:border-edge vdocs:bg-surface ' +
  'vdocs:p-1.5 vdocs:font-sans vdocs:text-sm vdocs:text-ink vdocs:outline-none vdocs:placeholder:text-edge vdocs:focus:border-accent';

const VERIFICATION_OPTIONS: { value: TRecipientAuthMethod; label: string }[] = [
  { value: 'passcode', label: 'Passcode' },
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS (One-Time Code)' },
  { value: 'kba', label: 'Knowledge-Based (KBA)' },
  { value: 'id', label: 'ID Check' },
];

// "(212) 555-1212" => "+12125551212". Users entering international numbers
// include the + prefix themselves and short-circuit out. See
// https://46elks.com/kb/e164
const convertToE164 = (input: string) => {
  const trimmed = (input || '').trim();
  if (!trimmed || trimmed.startsWith('+')) {
    return trimmed;
  }

  // Strip punctuation first, then a leading zero (which may have been inside
  // the punctuation, e.g. "(05"), then assume US and prepend the country code.
  return `+1${trimmed.replace(/[^0-9]/g, '').replace(/^0/, '')}`;
};

const addressBookIcon = (className: string): TemplateResult => html`
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class=${className}>
    <path d="M15 13a3 3 0 1 0-6 0" />
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />
    <circle cx="12" cy="8" r="2" />
  </svg>`;

// Field ids double as unique input names. Browsers frequently ignore
// autocomplete="off" and stack their own autofill pickers on top of our
// suggestions, but they cannot match saved entries against names that change
// every mount.
let pickerSeq = 0;

/**
 * A contact entry form for filling out Recipient objects when sending
 * envelopes. As the user types in the name fields the current text is reported
 * via vdocs-search-contacts, and the caller may update the `suggestions`
 * property with matching contacts (or pre-seed it). Selecting a suggestion
 * fills the form.
 *
 * @fires vdocs-search-contacts - Fired with the current name text as the user types. Use it to refresh `suggestions`.
 * @fires vdocs-submit-contact - Fired with an IContactSelectEvent when the user clicks OK.
 * @fires vdocs-cancel - Fired when the user clicks Cancel.
 */
export class VdocsContactPicker extends VdocsElement {
  static override properties = {
    templateRole: { attribute: false },
    suggestions: { attribute: false },
    availableAuthMethods: { attribute: false },
    firstName: { state: true },
    lastName: { state: true },
    email: { state: true },
    phone: { state: true },
    message: { state: true },
    delegator: { state: true },
    nameLocked: { state: true },
    authMethods: { state: true },
    passcode: { state: true },
    showSuggestions: { state: true },
  };

  /** The role this contact will be assigned to. Pre-fills the form fields. Property-only. */
  declare templateRole?: Partial<IRecipient> | null;
  /** Suggestions to display in a drop-down as the user types. Property-only; limit to the 5 best matches. */
  declare suggestions: TPickerContact[];
  /** The verification methods the sender's account may offer. Property-only. Passcode and email are the defaults. */
  declare availableAuthMethods: TRecipientAuthMethod[];

  private declare firstName: string;
  private declare lastName: string;
  private declare email: string;
  private declare phone: string;
  private declare message: string;
  private declare delegator: boolean;
  private declare nameLocked: boolean;
  private declare authMethods: TRecipientAuthMethod[];
  private declare passcode: string;
  private declare showSuggestions: boolean;

  private namesRow = createRef<HTMLDivElement>();
  private baseId = `vdocs-picker-${++pickerSeq}`;

  constructor() {
    super();
    this.suggestions = [];
    this.availableAuthMethods = [ 'passcode', 'email' ];
    this.firstName = '';
    this.lastName = '';
    this.email = '';
    this.phone = '';
    this.message = '';
    this.delegator = false;
    this.nameLocked = false;
    this.authMethods = [];
    this.passcode = '';
    this.showSuggestions = false;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('vdocs:inline-block');
  }

  override willUpdate(changed: PropertyValues<this>) {
    // The role pre-fills the form. delegator and name_locked are mutually
    // exclusive; delegator takes precedence if both are somehow set.
    if (changed.has('templateRole')) {
      const role = this.templateRole;
      this.firstName = role?.first_name || '';
      this.lastName = role?.last_name || '';
      this.email = role?.email || '';
      this.phone = role?.phone || '';
      this.message = role?.message || '';
      this.delegator = role?.delegator || false;
      this.nameLocked = role?.delegator ? false : role?.name_locked || false;
      this.authMethods = role?.auth_methods || [];
      this.passcode = role?.passcode || '';
    }
  }

  private get matchingSuggestions(): TPickerContact[] {
    return this.suggestions.filter(suggestion => !this.firstName || (suggestion.first_name || '').toLowerCase().includes(this.firstName.toLowerCase()));
  }

  private get canSubmit(): boolean {
    const hasBasics = !!this.firstName && !!this.lastName && isValidEmail(this.email);
    const hasAuthRequirements = !this.authMethods.length ||
      (this.authMethods.includes('passcode') && !!this.passcode) ||
      (this.authMethods.includes('kba') && !!this.firstName && !!this.lastName) ||
      (this.authMethods.includes('email') && !!this.email) ||
      (this.authMethods.includes('sms') && !!this.phone);
    return hasBasics && hasAuthRequirements;
  }

  private handleNameInput(field: 'firstName' | 'lastName', value: string) {
    this[field] = value;
    this.showSuggestions = true;
    this.emit('vdocs-search-contacts', value);
  }

  private handleSelectSuggestion(suggestion: TPickerContact) {
    this.firstName = suggestion.first_name || '';
    this.lastName = suggestion.last_name || '';
    this.email = suggestion.email || '';
    this.phone = suggestion.phone || '';
    this.showSuggestions = false;
  }

  private handleToggleAuthMethod(method: TRecipientAuthMethod, checked: boolean) {
    this.authMethods = checked ? [ ...this.authMethods, method ] : this.authMethods.filter(selected => selected !== method);
  }

  private handleSubmit() {
    this.showSuggestions = false;
    this.emit<IContactSelectEvent>('vdocs-submit-contact', {
      first_name: this.firstName,
      last_name: this.lastName,
      email: this.email,
      phone: this.phone,
      message: this.message,
      delegator: this.delegator,
      name_locked: this.nameLocked,
      auth_methods: this.authMethods,
      passcode: this.passcode,
    });
  }

  private renderSuggestions(): TemplateResult {
    return html`
      <div class="vdocs:max-h-[225px] vdocs:overflow-y-auto vdocs:bg-surface vdocs:font-sans vdocs:shadow-[0_0_15px_0_rgba(0,0,0,0.1)]">
        ${this.matchingSuggestions.map(suggestion => html`
          <button
            type="button"
            @click=${() => this.handleSelectSuggestion(suggestion)}
            class="vdocs:flex vdocs:w-full vdocs:cursor-pointer vdocs:flex-row vdocs:items-center vdocs:border-none vdocs:bg-transparent vdocs:px-3 vdocs:py-1.5 vdocs:text-left vdocs:font-sans vdocs:hover:bg-canvas">
            ${suggestion.picture ?
              html`<img alt="" src=${suggestion.picture} class="vdocs:mr-2 vdocs:size-8 vdocs:shrink-0 vdocs:rounded-full" />` :
                addressBookIcon('vdocs:mr-2 vdocs:size-8 vdocs:shrink-0 vdocs:text-muted')}
            <span class="vdocs:flex vdocs:flex-col">
              <span class="vdocs:mb-[3px] vdocs:text-base vdocs:font-medium vdocs:text-ink">${formatFullName(suggestion)}</span>
              ${suggestion.email ? html`<span class="vdocs:mb-[3px] vdocs:text-sm vdocs:text-muted">${suggestion.email}</span>` : nothing}
              ${suggestion.phone ? html`<span class="vdocs:mb-[3px] vdocs:text-sm vdocs:text-muted">${suggestion.phone}</span>` : nothing}
            </span>
          </button>`)}
      </div>`;
  }

  override render() {
    const hasSms = this.availableAuthMethods.includes('sms');
    const verificationOptions = VERIFICATION_OPTIONS.filter(option => this.availableAuthMethods.includes(option.value));
    const suggestionsOpen = this.showSuggestions && this.matchingSuggestions.length > 0;

    return html`
      <form
        autocomplete="off"
        @submit=${(e: Event) => e.preventDefault()}
        class="vdocs:box-border vdocs:flex vdocs:w-[300px] vdocs:flex-col vdocs:gap-3 vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:bg-canvas vdocs:p-3 vdocs:font-sans vdocs:shadow-[0_0_15px_0_rgba(0,0,0,0.1)]">
        <div class="vdocs:relative vdocs:flex vdocs:flex-row vdocs:items-start vdocs:gap-2">
          <label for=${`${this.baseId}-first`} class=${LABEL_CLASSES}>Name:</label>
          <div ${ref(this.namesRow)} class="vdocs:flex vdocs:min-w-0 vdocs:flex-1 vdocs:flex-row vdocs:gap-2">
            <input
              id=${`${this.baseId}-first`}
              name=${`${this.baseId}-first`}
              type="text"
              aria-label="First name"
              data-lpignore="true"
              placeholder="First..."
              class=${INPUT_CLASSES}
              .value=${live(this.firstName)}
              @focus=${() => {
                this.showSuggestions = true;
              }}
              @input=${(e: Event) => this.handleNameInput('firstName', (e.target as HTMLInputElement).value)} />
            <input
              id=${`${this.baseId}-last`}
              name=${`${this.baseId}-last`}
              type="text"
              aria-label="Last name"
              data-lpignore="true"
              placeholder="Last..."
              class=${INPUT_CLASSES}
              .value=${live(this.lastName)}
              @focus=${() => {
                this.showSuggestions = true;
              }}
              @input=${(e: Event) => this.handleNameInput('lastName', (e.target as HTMLInputElement).value)} />
          </div>

          ${suggestionsOpen ?
            html`
              <vdocs-portal .anchor=${this.namesRow.value} @vdocs-click-away=${() => {
                this.showSuggestions = false;
              }}>
                ${this.renderSuggestions()}
              </vdocs-portal>` :
            nothing}
        </div>

        <div class="vdocs:flex vdocs:flex-row vdocs:items-start vdocs:gap-2">
          <label for=${`${this.baseId}-email`} class=${LABEL_CLASSES}>Email:</label>
          <input
            id=${`${this.baseId}-email`}
            name=${`${this.baseId}-email`}
            type="text"
            data-lpignore="true"
            placeholder="Invite/verify via email..."
            class=${INPUT_CLASSES}
            .value=${live(this.email)}
            @focus=${() => {
              this.showSuggestions = false;
            }}
            @input=${(e: Event) => {
              this.email = (e.target as HTMLInputElement).value;
            }} />
        </div>

        ${hasSms ?
          html`
            <div class="vdocs:flex vdocs:flex-row vdocs:items-start vdocs:gap-2">
              <label for=${`${this.baseId}-phone`} class=${LABEL_CLASSES}>Phone:</label>
              <input
                id=${`${this.baseId}-phone`}
                name=${`${this.baseId}-phone`}
                type="text"
                data-lpignore="true"
                placeholder="Invite/verify via SMS..."
                class=${INPUT_CLASSES}
                .value=${live(this.phone)}
                @focus=${() => {
                  this.showSuggestions = false;
                }}
                @input=${(e: Event) => {
                  this.phone = convertToE164((e.target as HTMLInputElement).value);
                }} />
            </div>` :
          nothing}

        ${verificationOptions.length > 0 ?
          html`
            <div class="vdocs:flex vdocs:flex-row vdocs:items-start vdocs:gap-2">
              <div class=${LABEL_CLASSES}>Verification Methods:</div>
              <div class="vdocs:flex vdocs:flex-col">
                ${verificationOptions.map(option => html`
                  <div class="vdocs:flex vdocs:flex-row vdocs:items-center vdocs:whitespace-nowrap vdocs:px-2 vdocs:py-[5px]">
                    <vdocs-checkbox
                      size="small"
                      label=${option.label}
                      ?checked=${this.authMethods.includes(option.value)}
                      @vdocs-checked-change=${(e: CustomEvent<{ checked: boolean }>) => this.handleToggleAuthMethod(option.value, e.detail.checked)}></vdocs-checkbox>
                  </div>`)}
              </div>
            </div>` :
          nothing}

        ${this.authMethods.includes('passcode') ?
          html`
            <div class="vdocs:flex vdocs:flex-row vdocs:items-start vdocs:gap-2">
              <label for=${`${this.baseId}-passcode`} class=${LABEL_CLASSES}>Passcode:</label>
              <input
                id=${`${this.baseId}-passcode`}
                name=${`${this.baseId}-passcode`}
                type="text"
                data-lpignore="true"
                placeholder="4-8 digits recommended..."
                class=${INPUT_CLASSES}
                .value=${live(this.passcode)}
                @focus=${() => {
                  this.showSuggestions = false;
                }}
                @input=${(e: Event) => {
                  this.passcode = (e.target as HTMLInputElement).value;
                }} />
            </div>` :
          nothing}

        <div class="vdocs:flex vdocs:flex-row vdocs:items-start vdocs:gap-2">
          <div class=${LABEL_CLASSES}>Options:</div>
          <div class="vdocs:flex vdocs:flex-col">
            <div class="vdocs:flex vdocs:flex-row vdocs:items-center vdocs:whitespace-nowrap vdocs:px-2 vdocs:py-[5px]">
              <vdocs-checkbox
                size="small"
                label="May delegate signing"
                ?checked=${this.delegator}
                ?disabled=${this.nameLocked}
                @vdocs-checked-change=${(e: CustomEvent<{ checked: boolean }>) => {
                  this.delegator = e.detail.checked;
                  if (e.detail.checked) {
                    this.nameLocked = false;
                  }
                }}></vdocs-checkbox>
            </div>
            <div class="vdocs:flex vdocs:flex-row vdocs:items-center vdocs:whitespace-nowrap vdocs:px-2 vdocs:py-[5px]">
              <vdocs-checkbox
                size="small"
                label="Name locked"
                ?checked=${this.nameLocked}
                ?disabled=${this.delegator}
                @vdocs-checked-change=${(e: CustomEvent<{ checked: boolean }>) => {
                  this.nameLocked = e.detail.checked;
                  if (e.detail.checked) {
                    this.delegator = false;
                  }
                }}></vdocs-checkbox>
            </div>
          </div>
        </div>

        <div class="vdocs:flex vdocs:flex-row vdocs:items-start vdocs:gap-2">
          <label for=${`${this.baseId}-message`} class=${LABEL_CLASSES}>Message:</label>
          <textarea
            id=${`${this.baseId}-message`}
            name=${`${this.baseId}-message`}
            rows="3"
            data-lpignore="true"
            placeholder="Optional message to include in invitation..."
            class="${INPUT_CLASSES} vdocs:resize-y"
            .value=${live(this.message)}
            @focus=${() => {
              this.showSuggestions = false;
            }}
            @input=${(e: Event) => {
              this.message = (e.target as HTMLTextAreaElement).value;
            }}></textarea>
        </div>

        <div class="vdocs:mt-2 vdocs:flex vdocs:flex-row vdocs:justify-end vdocs:gap-1.5">
          <vdocs-button
            variant="outline"
            label="Cancel"
            size="small"
            @click=${() => {
              this.showSuggestions = false;
              this.emit('vdocs-cancel');
            }}></vdocs-button>
          <vdocs-button label="OK" size="small" ?disabled=${!this.canSubmit} @click=${() => this.handleSubmit()}></vdocs-button>
        </div>
      </form>`;
  }
}

register('vdocs-contact-picker', VdocsContactPicker);

// vdocs-cancel is already declared by the dialogs with the same payload, so
// only the picker-specific events are declared here.
declare global {
  interface HTMLElementTagNameMap {
    'vdocs-contact-picker': VdocsContactPicker;
  }

  interface GlobalEventHandlersEventMap {
    'vdocs-search-contacts': CustomEvent<string>;
    'vdocs-submit-contact': CustomEvent<IContactSelectEvent>;
  }
}
