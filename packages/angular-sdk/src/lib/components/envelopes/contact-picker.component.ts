import { formatFullName, isValidEmail } from '@verdocs/js-sdk';
import type { IProfile, IRecipient, TRecipientAuthMethod } from '@verdocs/js-sdk';
import { ChangeDetectionStrategy, Component, computed, input, linkedSignal, output, signal } from '@angular/core';
import { VerdocsCheckboxComponent } from '../../controls/checkbox.component';
import { VerdocsButtonComponent } from '../../controls/button.component';
import { VerdocsPortalComponent } from '../../controls/portal.component';

/** A contact suggestion, typically a recent recipient or an address-book entry. */
export type TPickerContact = Partial<IProfile>;

/** The completed recipient details, reported through the submit output. */
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

// "(212) 555-1212" => "+12125551212". Users entering international numbers include the +
// prefix themselves and short-circuit out. See https://46elks.com/kb/e164
const convertToE164 = (input: string) => {
  const trimmed = (input || '').trim();
  if (!trimmed || trimmed.startsWith('+')) {
    return trimmed;
  }

  // Strip punctuation first, then a leading zero (which may have been inside the
  // punctuation, e.g. "(05"), then assume US and prepend the country code.
  return `+1${trimmed.replace(/[^0-9]/g, '').replace(/^0/, '')}`;
};

// Unique ids double as field names. Browsers frequently ignore autocomplete="off" and
// stack their own autofill pickers on top of our suggestions, but they cannot match
// saved entries against names that change every mount.
let nextPickerId = 0;

/**
 * A contact entry form for filling out Recipient objects when sending envelopes.
 *
 * The picker can provide address-book style suggestions: as the user types in the name
 * fields the current text is reported via the searchContacts output, and the caller may
 * update the suggestions input with matching contacts (or pre-seed it with entries such
 * as recently-used contacts). Selecting a suggestion fills the form.
 */
@Component({
  selector: 'verdocs-contact-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ VerdocsButtonComponent, VerdocsCheckboxComponent, VerdocsPortalComponent ],
  host: { '[style.display]': `'block'` },
  template: `
    <form
      autocomplete="off"
      (submit)="$event.preventDefault()"
      class="vdocs:box-border vdocs:flex vdocs:w-[300px] vdocs:flex-col vdocs:gap-3 vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:bg-canvas vdocs:p-3 vdocs:font-sans vdocs:shadow-[0_0_15px_0_rgba(0,0,0,0.1)]">
      <div class="vdocs:relative vdocs:flex vdocs:flex-row vdocs:items-start vdocs:gap-2">
        <label [for]="firstNameFieldId" [class]="labelClasses">Name:</label>
        <div #namesRow class="vdocs:flex vdocs:min-w-0 vdocs:flex-1 vdocs:flex-row vdocs:gap-2">
          <input
            [id]="firstNameFieldId"
            [name]="firstNameFieldId"
            type="text"
            aria-label="First name"
            data-lpignore="true"
            [value]="firstName()"
            placeholder="First..."
            [class]="inputClasses"
            (focus)="showSuggestions.set(true)"
            (input)="onNameInput(firstName, $event)" />
          <input
            [id]="lastNameFieldId"
            [name]="lastNameFieldId"
            type="text"
            aria-label="Last name"
            data-lpignore="true"
            [value]="lastName()"
            placeholder="Last..."
            [class]="inputClasses"
            (focus)="showSuggestions.set(true)"
            (input)="onNameInput(lastName, $event)" />
        </div>

        @if (suggestionsOpen()) {
          <verdocs-portal [anchor]="namesRow" (clickAway)="showSuggestions.set(false)">
            <div class="vdocs:max-h-[225px] vdocs:overflow-y-auto vdocs:bg-surface vdocs:font-sans vdocs:shadow-[0_0_15px_0_rgba(0,0,0,0.1)]">
              @for (suggestion of matchingSuggestions(); track suggestion.id ?? suggestion.email) {
                <button
                  type="button"
                  (click)="selectSuggestion(suggestion)"
                  class="vdocs:flex vdocs:w-full vdocs:cursor-pointer vdocs:flex-row vdocs:items-center vdocs:border-none vdocs:bg-transparent vdocs:px-3 vdocs:py-1.5 vdocs:text-left vdocs:font-sans vdocs:hover:bg-canvas">
                  @if (suggestion.picture; as picture) {
                    <img alt="" [src]="picture" class="vdocs:mr-2 vdocs:size-8 vdocs:shrink-0 vdocs:rounded-full" />
                  } @else {
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      aria-hidden="true"
                      class="vdocs:mr-2 vdocs:size-8 vdocs:shrink-0 vdocs:text-muted">
                      <path d="M15 13a3 3 0 1 0-6 0" />
                      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />
                      <circle cx="12" cy="8" r="2" />
                    </svg>
                  }
                  <span class="vdocs:flex vdocs:flex-col">
                    <span class="vdocs:mb-[3px] vdocs:text-base vdocs:font-medium vdocs:text-ink">{{ suggestionName(suggestion) }}</span>
                    @if (suggestion.email) {
                      <span class="vdocs:mb-[3px] vdocs:text-sm vdocs:text-muted">{{ suggestion.email }}</span>
                    }
                    @if (suggestion.phone) {
                      <span class="vdocs:mb-[3px] vdocs:text-sm vdocs:text-muted">{{ suggestion.phone }}</span>
                    }
                  </span>
                </button>
              }
            </div>
          </verdocs-portal>
        }
      </div>

      <div class="vdocs:flex vdocs:flex-row vdocs:items-start vdocs:gap-2">
        <label [for]="emailFieldId" [class]="labelClasses">Email:</label>
        <input
          [id]="emailFieldId"
          [name]="emailFieldId"
          type="text"
          data-lpignore="true"
          [value]="email()"
          placeholder="Invite/verify via email..."
          [class]="inputClasses"
          (focus)="showSuggestions.set(false)"
          (input)="email.set(inputValue($event))" />
      </div>

      @if (hasSms()) {
        <div class="vdocs:flex vdocs:flex-row vdocs:items-start vdocs:gap-2">
          <label [for]="phoneFieldId" [class]="labelClasses">Phone:</label>
          <input
            [id]="phoneFieldId"
            [name]="phoneFieldId"
            type="text"
            data-lpignore="true"
            [value]="phone()"
            placeholder="Invite/verify via SMS..."
            [class]="inputClasses"
            (focus)="showSuggestions.set(false)"
            (input)="onPhoneInput($event)" />
        </div>
      }

      @if (verificationOptions().length > 0) {
        <div class="vdocs:flex vdocs:flex-row vdocs:items-start vdocs:gap-2">
          <div [class]="labelClasses">Verification Methods:</div>
          <div class="vdocs:flex vdocs:flex-col">
            @for (option of verificationOptions(); track option.value) {
              <div class="vdocs:flex vdocs:flex-row vdocs:items-center vdocs:whitespace-nowrap vdocs:px-2 vdocs:py-[5px]">
                <verdocs-checkbox
                  size="small"
                  [label]="option.label"
                  [checked]="authMethods().includes(option.value)"
                  (checkedChange)="toggleAuthMethod(option.value, $event)" />
              </div>
            }
          </div>
        </div>
      }

      @if (authMethods().includes('passcode')) {
        <div class="vdocs:flex vdocs:flex-row vdocs:items-start vdocs:gap-2">
          <label [for]="passcodeFieldId" [class]="labelClasses">Passcode:</label>
          <input
            [id]="passcodeFieldId"
            [name]="passcodeFieldId"
            type="text"
            data-lpignore="true"
            [value]="passcode()"
            placeholder="4-8 digits recommended..."
            [class]="inputClasses"
            (focus)="showSuggestions.set(false)"
            (input)="passcode.set(inputValue($event))" />
        </div>
      }

      <div class="vdocs:flex vdocs:flex-row vdocs:items-start vdocs:gap-2">
        <div [class]="labelClasses">Options:</div>
        <div class="vdocs:flex vdocs:flex-col">
          <div class="vdocs:flex vdocs:flex-row vdocs:items-center vdocs:whitespace-nowrap vdocs:px-2 vdocs:py-[5px]">
            <verdocs-checkbox
              size="small"
              label="May delegate signing"
              [checked]="delegator()"
              [disabled]="nameLocked()"
              (checkedChange)="setDelegator($event)" />
          </div>
          <div class="vdocs:flex vdocs:flex-row vdocs:items-center vdocs:whitespace-nowrap vdocs:px-2 vdocs:py-[5px]">
            <verdocs-checkbox
              size="small"
              label="Name locked"
              [checked]="nameLocked()"
              [disabled]="delegator()"
              (checkedChange)="setNameLocked($event)" />
          </div>
        </div>
      </div>

      <div class="vdocs:flex vdocs:flex-row vdocs:items-start vdocs:gap-2">
        <label [for]="messageFieldId" [class]="labelClasses">Message:</label>
        <textarea
          [id]="messageFieldId"
          [name]="messageFieldId"
          rows="3"
          data-lpignore="true"
          [value]="message()"
          placeholder="Optional message to include in invitation..."
          [class]="inputClasses + ' vdocs:resize-y'"
          (focus)="showSuggestions.set(false)"
          (input)="message.set(inputValue($event))"></textarea>
      </div>

      <div class="vdocs:mt-2 vdocs:flex vdocs:flex-row vdocs:justify-end vdocs:gap-1.5">
        <verdocs-button variant="outline" label="Cancel" size="small" (click)="onCancel()" />
        <verdocs-button label="OK" size="small" [disabled]="!canSubmit()" (click)="onSubmit()" />
      </div>
    </form>
  `,
})
export class VerdocsContactPickerComponent {
  /** The role this contact will be assigned to. Pre-fills the form fields. */
  readonly templateRole = input<Partial<IRecipient> | null>(null);
  /**
   * If set, suggestions will be displayed in a drop-down list as the user types in the
   * name fields. It is recommended that this be limited to the 5 best matching records.
   */
  readonly suggestions = input<TPickerContact[]>([]);
  /**
   * The verification methods the sender's account may offer, typically derived from the
   * organization's entitlements. Passcode and email are always available; include 'sms'
   * to enable SMS verification (this also shows the phone row), and 'kba' or 'id' if the
   * account has those entitlements.
   */
  readonly availableAuthMethods = input<TRecipientAuthMethod[]>([ 'passcode', 'email' ]);

  /** Emitted as the user types in a name field. Use the query to refresh `suggestions`. */
  readonly searchContacts = output<string>();
  /** Emitted with the completed contact details when the user clicks OK. */
  readonly submit = output<IContactSelectEvent>();
  /** Emitted when the user clicks Cancel. */
  readonly cancel = output<void>();

  protected readonly labelClasses = LABEL_CLASSES;
  protected readonly inputClasses = INPUT_CLASSES;

  private readonly baseId = `vdocs-contact-picker-${nextPickerId++}`;
  protected readonly firstNameFieldId = `${this.baseId}-first-name`;
  protected readonly lastNameFieldId = `${this.baseId}-last-name`;
  protected readonly emailFieldId = `${this.baseId}-email`;
  protected readonly phoneFieldId = `${this.baseId}-phone`;
  protected readonly passcodeFieldId = `${this.baseId}-passcode`;
  protected readonly messageFieldId = `${this.baseId}-message`;

  // Each field follows the template role until the user edits it, and resets
  // if the host points the picker at a different role.
  protected readonly firstName = linkedSignal(() => this.templateRole()?.first_name || '');
  protected readonly lastName = linkedSignal(() => this.templateRole()?.last_name || '');
  protected readonly email = linkedSignal(() => this.templateRole()?.email || '');
  protected readonly phone = linkedSignal(() => this.templateRole()?.phone || '');
  protected readonly message = linkedSignal(() => this.templateRole()?.message || '');
  protected readonly delegator = linkedSignal(() => this.templateRole()?.delegator || false);
  // delegator and name_locked are mutually exclusive; delegator takes precedence if both are somehow set
  protected readonly nameLocked = linkedSignal(() => (this.templateRole()?.delegator ? false : this.templateRole()?.name_locked || false));
  protected readonly authMethods = linkedSignal<TRecipientAuthMethod[]>(() => this.templateRole()?.auth_methods || []);
  protected readonly passcode = linkedSignal(() => this.templateRole()?.passcode || '');

  protected readonly showSuggestions = signal(false);

  protected readonly hasSms = computed(() => this.availableAuthMethods().includes('sms'));

  protected readonly verificationOptions = computed(() =>
    VERIFICATION_OPTIONS.filter(option => this.availableAuthMethods().includes(option.value)));

  protected readonly matchingSuggestions = computed(() => {
    const firstName = this.firstName();
    return this.suggestions().filter(
      suggestion => !firstName || (suggestion.first_name || '').toLowerCase().includes(firstName.toLowerCase()));
  });

  protected readonly suggestionsOpen = computed(() => this.showSuggestions() && this.matchingSuggestions().length > 0);

  protected readonly canSubmit = computed(() => {
    const authMethods = this.authMethods();
    const hasBasics = !!this.firstName() && !!this.lastName() && isValidEmail(this.email());
    const hasAuthRequirements = !authMethods.length ||
      (authMethods.includes('passcode') && !!this.passcode()) ||
      (authMethods.includes('kba') && !!this.firstName() && !!this.lastName()) ||
      (authMethods.includes('email') && !!this.email()) ||
      (authMethods.includes('sms') && !!this.phone());
    return hasBasics && hasAuthRequirements;
  });

  protected inputValue(event: Event) {
    return (event.target as HTMLInputElement | HTMLTextAreaElement).value;
  }

  protected onNameInput(field: { set: (value: string) => void }, event: Event) {
    const value = this.inputValue(event);
    field.set(value);
    this.showSuggestions.set(true);
    this.searchContacts.emit(value);
  }

  protected onPhoneInput(event: Event) {
    this.phone.set(convertToE164(this.inputValue(event)));
  }

  protected suggestionName(suggestion: TPickerContact) {
    return formatFullName(suggestion);
  }

  protected selectSuggestion(suggestion: TPickerContact) {
    this.firstName.set(suggestion.first_name || '');
    this.lastName.set(suggestion.last_name || '');
    this.email.set(suggestion.email || '');
    this.phone.set(suggestion.phone || '');
    this.showSuggestions.set(false);
  }

  protected toggleAuthMethod(method: TRecipientAuthMethod, checked: boolean) {
    this.authMethods.set(checked ? [ ...this.authMethods(), method ] : this.authMethods().filter(selected => selected !== method));
  }

  protected setDelegator(checked: boolean) {
    this.delegator.set(checked);
    if (checked) {
      this.nameLocked.set(false);
    }
  }

  protected setNameLocked(checked: boolean) {
    this.nameLocked.set(checked);
    if (checked) {
      this.delegator.set(false);
    }
  }

  protected onCancel() {
    this.showSuggestions.set(false);
    this.cancel.emit();
  }

  protected onSubmit() {
    this.showSuggestions.set(false);
    this.submit.emit({
      first_name: this.firstName(),
      last_name: this.lastName(),
      email: this.email(),
      phone: this.phone(),
      message: this.message(),
      delegator: this.delegator(),
      name_locked: this.nameLocked(),
      auth_methods: this.authMethods(),
      passcode: this.passcode(),
    });
  }
}
