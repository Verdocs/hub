import { html, nothing } from 'lit';
import { live } from 'lit/directives/live.js';
import { createRef, ref } from 'lit/directives/ref.js';
import type { PropertyValues, TemplateResult } from 'lit';
import { formatFullName, isValidEmail } from '@verdocs/js-sdk';
import type { IProfile, IRecipient, TRecipientAuthMethod } from '@verdocs/js-sdk';
import { lockClosedIcon } from '../controls/icons/index.js';
import { updateScrollFade } from '../utils/scroll-fade.js';
import { VdocsElement } from '../base/vdocs-element.js';
import { register } from '../base/register.js';
import '../controls/vdocs-button.js';

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

type TSigningOption = 'none' | 'delegator' | 'name_locked';

const FIELD_CLASSES = 'vdocs:mb-2.5 vdocs:flex vdocs:flex-col vdocs:gap-1';

const LABEL_CLASSES = 'vdocs:text-xs vdocs:font-medium vdocs:text-ink';

const INPUT_CLASSES = 'vdocs:box-border vdocs:w-full vdocs:rounded-ctl vdocs:border vdocs:border-solid vdocs:border-edge vdocs:bg-surface vdocs:px-2.5 ' +
  'vdocs:font-sans vdocs:text-[13px] vdocs:text-ink vdocs:outline-none vdocs:placeholder:text-edge ' +
  'vdocs:focus:border-accent vdocs:focus:ring-2 vdocs:focus:ring-accent-tint-dark';

const GROUP_LABEL_CLASSES = 'vdocs:mb-1.5 vdocs:text-xs vdocs:font-medium vdocs:text-ink';

const PILL_CLASSES = 'vdocs:inline-flex vdocs:h-[26px] vdocs:items-center vdocs:gap-1 vdocs:whitespace-nowrap vdocs:rounded-full vdocs:border ' +
  'vdocs:border-solid vdocs:px-2.5 vdocs:font-sans vdocs:text-xs vdocs:font-medium vdocs:outline-none ' +
  'vdocs:focus-visible:outline-2 vdocs:focus-visible:outline-offset-2 vdocs:focus-visible:outline-accent';

const VERIFICATION_OPTIONS: { value: TRecipientAuthMethod; label: string }[] = [
  { value: 'email', label: 'Email' },
  { value: 'passcode', label: 'Passcode' },
  { value: 'sms', label: 'SMS code' },
  { value: 'kba', label: 'KBA' },
  { value: 'id', label: 'ID check' },
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
 * envelopes.
 *
 * The picker carries no card chrome of its own: the host supplies the surface
 * and, when it constrains the height, the fields scroll above a pinned Done
 * button.
 *
 * As the user types in the name fields the current text is reported via
 * vdocs-search-contacts, and the caller may update the `suggestions` property
 * with matching contacts (or pre-seed it). Selecting a suggestion fills the
 * form.
 *
 * @fires vdocs-search-contacts - Fired with the current name text as the user types. Use it to refresh `suggestions`.
 * @fires vdocs-submit-contact - Fired with an IContactSelectEvent when the user clicks Done.
 * @fires vdocs-cancel - Fired when the user clicks Cancel.
 */
export class VdocsContactPicker extends VdocsElement {
  static override properties = {
    templateRole: { attribute: false },
    suggestions: { attribute: false },
    availableAuthMethods: { attribute: false },
    showCancel: { attribute: false },
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
  /**
   * The verification methods the sender's account may offer, typically derived from the
   * organization's entitlements. All five methods are always listed; the ones missing here
   * are shown locked. Include 'sms' to enable SMS verification (that also shows the phone
   * field), and 'kba' or 'id' if the account has those entitlements. Property-only.
   */
  declare availableAuthMethods: TRecipientAuthMethod[];
  /**
   * Whether to show a Cancel button beside Done. Hosts with their own way out turn it off.
   * Property-only, because it defaults to true and a boolean attribute cannot switch that off.
   */
  declare showCancel: boolean;

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

  private body = createRef<HTMLDivElement>();
  private namesRow = createRef<HTMLDivElement>();
  private suggestionList = createRef<HTMLDivElement>();
  private baseId = `vdocs-picker-${++pickerSeq}`;

  constructor() {
    super();
    this.suggestions = [];
    this.availableAuthMethods = [ 'passcode', 'email' ];
    this.showCancel = true;
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
    // The host adds no box of its own, so the form takes its height straight
    // from whatever the host page constrains, the way the React root does.
    this.classList.add('vdocs:contents');
    document.addEventListener('click', this.handleDocumentClick);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this.handleDocumentClick);
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

  override updated() {
    updateScrollFade(this.body.value);

    // The suggestion list floats over the form rather than adding to the
    // body's scroll height, so we place it under the name row by hand. Both
    // measurements only exist after layout.
    const body = this.body.value;
    const namesRow = this.namesRow.value;
    const list = this.suggestionList.value;
    if (body && namesRow && list) {
      list.style.top = `${namesRow.offsetTop + namesRow.offsetHeight - body.scrollTop + 4}px`;
    }
  }

  private handleDocumentClick = (e: MouseEvent) => {
    if (this.showSuggestions && !this.contains(e.target as Node)) {
      this.showSuggestions = false;
    }
  };

  private get matchingSuggestions(): TPickerContact[] {
    return this.suggestions.filter(suggestion => !this.firstName || (suggestion.first_name || '').toLowerCase().includes(this.firstName.toLowerCase()));
  }

  // Every method the sender switched on has to be usable, so each one checks
  // the field it depends on. The legacy control OR'd these together, which let
  // an SMS-verified recipient through with no phone number.
  private methodSatisfied(method: TRecipientAuthMethod): boolean {
    switch (method) {
      case 'passcode':
        return !!this.passcode;
      case 'sms':
        return !!this.phone;
      case 'email':
        return !!this.email;
      case 'kba':
        return !!this.firstName && !!this.lastName;
      default:
        return true;
    }
  }

  private get canSubmit(): boolean {
    const hasBasics = !!this.firstName && !!this.lastName && isValidEmail(this.email);
    return hasBasics && this.authMethods.every(method => this.methodSatisfied(method));
  }

  private get signingOption(): TSigningOption {
    if (this.delegator) {
      return 'delegator';
    }

    return this.nameLocked ? 'name_locked' : 'none';
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

  private handleToggleAuthMethod(method: TRecipientAuthMethod) {
    this.authMethods = this.authMethods.includes(method) ?
        this.authMethods.filter(selected => selected !== method) :
        [ ...this.authMethods, method ];
  }

  private handleSetSigningOption(option: TSigningOption) {
    this.delegator = option === 'delegator';
    this.nameLocked = option === 'name_locked';
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

  // A locked pill that is already selected stays clickable, otherwise the
  // sender could never clear a method their plan has since dropped.
  private renderPill(label: string, selected: boolean, onClick: () => void, locked = false): TemplateResult {
    const stateClasses = selected ?
      'vdocs:border-accent vdocs:bg-accent-tint vdocs:text-accent' :
      'vdocs:border-edge vdocs:bg-surface vdocs:text-muted';

    return html`
      <button
        type="button"
        aria-pressed=${selected}
        ?disabled=${locked && !selected}
        title=${locked ? 'Not included in your plan' : nothing}
        @click=${onClick}
        class="${PILL_CLASSES} ${stateClasses} ${locked ? 'vdocs:opacity-50' : ''} ${locked && !selected ? 'vdocs:cursor-default' : 'vdocs:cursor-pointer'}">
        ${locked ? lockClosedIcon({ className: 'vdocs:size-3 vdocs:shrink-0' }) : nothing}
        ${label}
      </button>`;
  }

  private renderSuggestions(): TemplateResult {
    return html`
      <div
        ${ref(this.suggestionList)}
        class="vdocs:absolute vdocs:inset-x-0 vdocs:z-20 vdocs:max-h-[225px] vdocs:overflow-y-auto vdocs:rounded-ctl vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:bg-surface vdocs:font-sans vdocs:shadow-[0_8px_24px_0_rgba(9,44,76,0.14)]">
        ${this.matchingSuggestions.map(suggestion => html`
          <button
            type="button"
            @click=${() => this.handleSelectSuggestion(suggestion)}
            class="vdocs:flex vdocs:w-full vdocs:cursor-pointer vdocs:flex-row vdocs:items-center vdocs:border-none vdocs:bg-transparent vdocs:px-3 vdocs:py-1.5 vdocs:text-left vdocs:font-sans vdocs:hover:bg-accent-tint">
            ${suggestion.picture ?
              html`<img alt="" src=${suggestion.picture} class="vdocs:mr-2 vdocs:size-7 vdocs:shrink-0 vdocs:rounded-full" />` :
                addressBookIcon('vdocs:mr-2 vdocs:size-7 vdocs:shrink-0 vdocs:text-muted')}
            <span class="vdocs:flex vdocs:min-w-0 vdocs:flex-col">
              <span class="vdocs:text-[13px] vdocs:font-medium vdocs:text-ink">${formatFullName(suggestion)}</span>
              ${suggestion.email ? html`<span class="vdocs:truncate vdocs:text-xs vdocs:text-muted">${suggestion.email}</span>` : nothing}
              ${suggestion.phone ? html`<span class="vdocs:truncate vdocs:text-xs vdocs:text-muted">${suggestion.phone}</span>` : nothing}
            </span>
          </button>`)}
      </div>`;
  }

  override render() {
    const hasSms = this.availableAuthMethods.includes('sms');
    const suggestionsOpen = this.showSuggestions && this.matchingSuggestions.length > 0;

    return html`
      <form
        autocomplete="off"
        @submit=${(e: Event) => e.preventDefault()}
        class="vdocs:box-border vdocs:flex vdocs:min-h-0 vdocs:flex-1 vdocs:flex-col vdocs:font-sans vdocs:text-ink">
        <div class="vdocs:group vdocs:relative vdocs:flex vdocs:min-h-0 vdocs:flex-1 vdocs:flex-col">
          <div
            ${ref(this.body)}
            class="vdocs:relative vdocs:min-h-0 vdocs:flex-1 vdocs:overflow-y-auto"
            @scroll=${(e: Event) => {
              updateScrollFade(e.currentTarget as HTMLElement);
              this.showSuggestions = false;
            }}>
            <div ${ref(this.namesRow)} class="vdocs:relative vdocs:flex vdocs:flex-row vdocs:gap-2">
              <div class="${FIELD_CLASSES} vdocs:min-w-0 vdocs:flex-1">
                <label for=${`${this.baseId}-first-name`} class=${LABEL_CLASSES}>First name</label>
                <input
                  id=${`${this.baseId}-first-name`}
                  name=${`${this.baseId}-first-name`}
                  type="text"
                  data-lpignore="true"
                  class="${INPUT_CLASSES} vdocs:h-[34px]"
                  .value=${live(this.firstName)}
                  @focus=${() => {
                    this.showSuggestions = true;
                  }}
                  @input=${(e: Event) => this.handleNameInput('firstName', (e.target as HTMLInputElement).value)} />
              </div>
              <div class="${FIELD_CLASSES} vdocs:min-w-0 vdocs:flex-1">
                <label for=${`${this.baseId}-last-name`} class=${LABEL_CLASSES}>Last name</label>
                <input
                  id=${`${this.baseId}-last-name`}
                  name=${`${this.baseId}-last-name`}
                  type="text"
                  data-lpignore="true"
                  class="${INPUT_CLASSES} vdocs:h-[34px]"
                  .value=${live(this.lastName)}
                  @focus=${() => {
                    this.showSuggestions = true;
                  }}
                  @input=${(e: Event) => this.handleNameInput('lastName', (e.target as HTMLInputElement).value)} />
              </div>
            </div>

            <div class=${FIELD_CLASSES}>
              <label for=${`${this.baseId}-email`} class=${LABEL_CLASSES}>Email</label>
              <input
                id=${`${this.baseId}-email`}
                name=${`${this.baseId}-email`}
                type="text"
                data-lpignore="true"
                class="${INPUT_CLASSES} vdocs:h-[34px]"
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
                <div class=${FIELD_CLASSES}>
                  <label for=${`${this.baseId}-phone`} class=${LABEL_CLASSES}>
                    Phone <span class="vdocs:font-normal vdocs:text-muted">(optional)</span>
                  </label>
                  <input
                    id=${`${this.baseId}-phone`}
                    name=${`${this.baseId}-phone`}
                    type="text"
                    data-lpignore="true"
                    placeholder="+1 (555) 000-0000"
                    class="${INPUT_CLASSES} vdocs:h-[34px]"
                    .value=${live(this.phone)}
                    @focus=${() => {
                      this.showSuggestions = false;
                    }}
                    @input=${(e: Event) => {
                      this.phone = convertToE164((e.target as HTMLInputElement).value);
                    }} />
                </div>` :
              nothing}

            <div class="vdocs:mt-0.5 vdocs:mb-3">
              <div id=${`${this.baseId}-verification`} class=${GROUP_LABEL_CLASSES}>Verification</div>
              <div
                role="group"
                aria-labelledby=${`${this.baseId}-verification`}
                class="vdocs:flex vdocs:flex-row vdocs:flex-wrap vdocs:gap-1.5">
                ${VERIFICATION_OPTIONS.map(option => this.renderPill(
                  option.label,
                  this.authMethods.includes(option.value),
                  () => this.handleToggleAuthMethod(option.value),
                  !this.availableAuthMethods.includes(option.value),
                ))}
              </div>

              ${this.authMethods.includes('passcode') ?
                html`
                  <div class="vdocs:mt-2 vdocs:flex vdocs:flex-row vdocs:items-center vdocs:gap-2">
                    <input
                      type="text"
                      aria-label="Passcode"
                      data-lpignore="true"
                      placeholder="4-8 digits"
                      class="${INPUT_CLASSES} vdocs:h-[30px] vdocs:w-[120px] vdocs:shrink-0"
                      .value=${live(this.passcode)}
                      @focus=${() => {
                        this.showSuggestions = false;
                      }}
                      @input=${(e: Event) => {
                        this.passcode = (e.target as HTMLInputElement).value;
                      }} />
                    <span class="vdocs:min-w-0 vdocs:flex-1 vdocs:self-center vdocs:text-[11px] vdocs:leading-[1.35] vdocs:text-muted">
                      PIN or passcode already known by the recipient
                    </span>
                  </div>` :
                nothing}
            </div>

            <div class="vdocs:mt-0.5 vdocs:mb-3">
              <div id=${`${this.baseId}-signing`} class=${GROUP_LABEL_CLASSES}>Signing options</div>
              <div role="group" aria-labelledby=${`${this.baseId}-signing`} class="vdocs:flex vdocs:flex-row vdocs:flex-wrap vdocs:gap-1.5">
                ${this.renderPill('None', this.signingOption === 'none', () => this.handleSetSigningOption('none'))}
                ${this.renderPill('May delegate', this.signingOption === 'delegator', () => this.handleSetSigningOption('delegator'))}
                ${this.renderPill('Name locked', this.signingOption === 'name_locked', () => this.handleSetSigningOption('name_locked'))}
              </div>
            </div>

            <div class=${FIELD_CLASSES}>
              <label for=${`${this.baseId}-message`} class=${LABEL_CLASSES}>
                Message <span class="vdocs:font-normal vdocs:text-muted">(optional)</span>
              </label>
              <textarea
                id=${`${this.baseId}-message`}
                name=${`${this.baseId}-message`}
                data-lpignore="true"
                placeholder="Add a message to the invitation"
                class="${INPUT_CLASSES} vdocs:h-14 vdocs:resize-y vdocs:py-2"
                .value=${live(this.message)}
                @focus=${() => {
                  this.showSuggestions = false;
                }}
                @input=${(e: Event) => {
                  this.message = (e.target as HTMLTextAreaElement).value;
                }}></textarea>
            </div>
          </div>

          <div
            aria-hidden="true"
            class="vdocs:pointer-events-none vdocs:absolute vdocs:inset-x-0 vdocs:bottom-0 vdocs:h-9 vdocs:bg-linear-to-b vdocs:from-surface/0 vdocs:to-surface vdocs:opacity-0 vdocs:transition-opacity vdocs:duration-150 vdocs:group-[.vdocs-scroll-more]:opacity-100"></div>

          ${suggestionsOpen ? this.renderSuggestions() : nothing}
        </div>

        <div class="vdocs:mt-2.5 vdocs:flex vdocs:shrink-0 vdocs:flex-row vdocs:gap-2.5 vdocs:border-0 vdocs:border-t vdocs:border-solid vdocs:border-edge-light vdocs:pt-3">
          ${this.showCancel ?
            html`
              <vdocs-button
                variant="text"
                label="Cancel"
                size="small"
                @click=${() => {
                  this.showSuggestions = false;
                  this.emit('vdocs-cancel');
                }}></vdocs-button>` :
            nothing}
          <vdocs-button
            label="Done"
            size="small"
            class="vdocs:flex-1"
            ?disabled=${!this.canSubmit}
            @click=${() => this.handleSubmit()}></vdocs-button>
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
