import { formatFullName, isValidEmail } from '@verdocs/js-sdk';
import type { IProfile, IRecipient, TRecipientAuthMethod } from '@verdocs/js-sdk';
import {
  afterEveryRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  linkedSignal,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { VerdocsButtonComponent } from '../../controls/button.component';

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

const SIGNING_OPTIONS: { value: TSigningOption; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'delegator', label: 'May delegate' },
  { value: 'name_locked', label: 'Name locked' },
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

// Show the bottom fade only while there is more content below the fold. The class goes straight
// onto the DOM rather than into a signal, so running this after every render cannot loop.
const updateScrollFade = (body: HTMLElement | null | undefined) => {
  const wrap = body?.parentElement;
  if (!body || !wrap) {
    return;
  }

  const scrollable = body.scrollHeight > body.clientHeight + 1;
  const atEnd = body.scrollTop + body.clientHeight >= body.scrollHeight - 1;
  wrap.classList.toggle('vdocs-scroll-more', scrollable && !atEnd);
};

// Unique ids double as field names. Browsers frequently ignore autocomplete="off" and
// stack their own autofill pickers on top of our suggestions, but they cannot match
// saved entries against names that change every mount.
let nextPickerId = 0;

/**
 * A contact entry form for filling out Recipient objects when sending envelopes.
 *
 * The picker carries no card chrome of its own: the host supplies the surface and, when it
 * constrains the height, the fields scroll above a pinned Done button.
 *
 * The picker can provide address-book style suggestions: as the user types in the name
 * fields the current text is reported via the searchContacts output, and the caller may
 * update the suggestions input with matching contacts (or pre-seed it with entries such
 * as recently-used contacts). Selecting a suggestion fills the form.
 */
@Component({
  selector: 'verdocs-contact-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ VerdocsButtonComponent ],
  host: {
    class: 'vdocs:flex vdocs:min-h-0 vdocs:min-w-0 vdocs:flex-1 vdocs:flex-col',
    '(document:click)': 'onDocumentClick($event)',
  },
  template: `
    <form
      autocomplete="off"
      (submit)="$event.preventDefault()"
      class="vdocs:box-border vdocs:flex vdocs:min-h-0 vdocs:flex-1 vdocs:flex-col vdocs:font-sans vdocs:text-ink">
      <div class="vdocs:group vdocs:relative vdocs:flex vdocs:min-h-0 vdocs:flex-1 vdocs:flex-col">
        <div #body class="vdocs:relative vdocs:min-h-0 vdocs:flex-1 vdocs:overflow-y-auto" (scroll)="onBodyScroll($event)">
          <div #namesRow class="vdocs:relative vdocs:flex vdocs:flex-row vdocs:gap-2">
            <div [class]="fieldClasses + ' vdocs:min-w-0 vdocs:flex-1'">
              <label [for]="firstNameFieldId" [class]="labelClasses">First name</label>
              <input
                [id]="firstNameFieldId"
                [name]="firstNameFieldId"
                type="text"
                data-lpignore="true"
                [value]="firstName()"
                [class]="inputClasses + ' vdocs:h-[34px]'"
                (focus)="showSuggestions.set(true)"
                (input)="onNameInput(firstName, $event)" />
            </div>
            <div [class]="fieldClasses + ' vdocs:min-w-0 vdocs:flex-1'">
              <label [for]="lastNameFieldId" [class]="labelClasses">Last name</label>
              <input
                [id]="lastNameFieldId"
                [name]="lastNameFieldId"
                type="text"
                data-lpignore="true"
                [value]="lastName()"
                [class]="inputClasses + ' vdocs:h-[34px]'"
                (focus)="showSuggestions.set(true)"
                (input)="onNameInput(lastName, $event)" />
            </div>
          </div>

          <div [class]="fieldClasses">
            <label [for]="emailFieldId" [class]="labelClasses">Email</label>
            <input
              [id]="emailFieldId"
              [name]="emailFieldId"
              type="text"
              data-lpignore="true"
              [value]="email()"
              [class]="inputClasses + ' vdocs:h-[34px]'"
              (focus)="showSuggestions.set(false)"
              (input)="email.set(inputValue($event))" />
          </div>

          @if (hasSms()) {
            <div [class]="fieldClasses">
              <label [for]="phoneFieldId" [class]="labelClasses">
                Phone <span class="vdocs:font-normal vdocs:text-muted">(optional)</span>
              </label>
              <input
                [id]="phoneFieldId"
                [name]="phoneFieldId"
                type="text"
                data-lpignore="true"
                [value]="phone()"
                placeholder="+1 (555) 000-0000"
                [class]="inputClasses + ' vdocs:h-[34px]'"
                (focus)="showSuggestions.set(false)"
                (input)="onPhoneInput($event)" />
            </div>
          }

          <div class="vdocs:mt-0.5 vdocs:mb-3">
            <div [id]="verificationLabelId" [class]="groupLabelClasses">Verification</div>
            <div role="group" [attr.aria-labelledby]="verificationLabelId" class="vdocs:flex vdocs:flex-row vdocs:flex-wrap vdocs:gap-1.5">
              @for (option of verificationOptions; track option.value) {
                <button
                  type="button"
                  [attr.aria-pressed]="authMethods().includes(option.value)"
                  [disabled]="isLocked(option.value) && !authMethods().includes(option.value)"
                  [attr.title]="isLocked(option.value) ? 'Not included in your plan' : null"
                  [class]="pillClasses(authMethods().includes(option.value), isLocked(option.value))"
                  (click)="toggleAuthMethod(option.value)">
                  @if (isLocked(option.value)) {
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="1.5"
                      stroke="currentColor"
                      aria-hidden="true"
                      class="vdocs:size-3 vdocs:shrink-0">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  }
                  {{ option.label }}
                </button>
              }
            </div>

            @if (authMethods().includes('passcode')) {
              <div class="vdocs:mt-2 vdocs:flex vdocs:flex-row vdocs:items-center vdocs:gap-2">
                <input
                  type="text"
                  aria-label="Passcode"
                  data-lpignore="true"
                  [value]="passcode()"
                  placeholder="4-8 digits"
                  [class]="inputClasses + ' vdocs:h-[30px] vdocs:w-[120px] vdocs:shrink-0'"
                  (focus)="showSuggestions.set(false)"
                  (input)="passcode.set(inputValue($event))" />
                <span class="vdocs:min-w-0 vdocs:flex-1 vdocs:self-center vdocs:text-[11px] vdocs:leading-[1.35] vdocs:text-muted">
                  PIN or passcode already known by the recipient
                </span>
              </div>
            }
          </div>

          <div class="vdocs:mt-0.5 vdocs:mb-3">
            <div [id]="signingLabelId" [class]="groupLabelClasses">Signing options</div>
            <div role="group" [attr.aria-labelledby]="signingLabelId" class="vdocs:flex vdocs:flex-row vdocs:flex-wrap vdocs:gap-1.5">
              @for (option of signingOptions; track option.value) {
                <button
                  type="button"
                  [attr.aria-pressed]="signingOption() === option.value"
                  [class]="pillClasses(signingOption() === option.value, false)"
                  (click)="setSigningOption(option.value)">
                  {{ option.label }}
                </button>
              }
            </div>
          </div>

          <div [class]="fieldClasses">
            <label [for]="messageFieldId" [class]="labelClasses">
              Message <span class="vdocs:font-normal vdocs:text-muted">(optional)</span>
            </label>
            <textarea
              [id]="messageFieldId"
              [name]="messageFieldId"
              data-lpignore="true"
              [value]="message()"
              placeholder="Add a message to the invitation"
              [class]="inputClasses + ' vdocs:h-14 vdocs:resize-y vdocs:py-2'"
              (focus)="showSuggestions.set(false)"
              (input)="message.set(inputValue($event))"></textarea>
          </div>
        </div>

        <div
          aria-hidden="true"
          class="vdocs:pointer-events-none vdocs:absolute vdocs:inset-x-0 vdocs:bottom-0 vdocs:h-9 vdocs:bg-linear-to-b vdocs:from-surface/0 vdocs:to-surface vdocs:opacity-0 vdocs:transition-opacity vdocs:duration-150 vdocs:group-[.vdocs-scroll-more]:opacity-100"></div>

        @if (suggestionsOpen()) {
          <div
            #suggestionList
            class="vdocs:absolute vdocs:inset-x-0 vdocs:z-20 vdocs:max-h-[225px] vdocs:overflow-y-auto vdocs:rounded-ctl vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:bg-surface vdocs:font-sans vdocs:shadow-[0_8px_24px_0_rgba(9,44,76,0.14)]">
            @for (suggestion of matchingSuggestions(); track suggestion.id ?? suggestion.email) {
              <button
                type="button"
                (click)="selectSuggestion(suggestion)"
                class="vdocs:flex vdocs:w-full vdocs:cursor-pointer vdocs:flex-row vdocs:items-center vdocs:border-none vdocs:bg-transparent vdocs:px-3 vdocs:py-1.5 vdocs:text-left vdocs:font-sans vdocs:hover:bg-accent-tint">
                @if (suggestion.picture; as picture) {
                  <img alt="" [src]="picture" class="vdocs:mr-2 vdocs:size-7 vdocs:shrink-0 vdocs:rounded-full" />
                } @else {
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                    class="vdocs:mr-2 vdocs:size-7 vdocs:shrink-0 vdocs:text-muted">
                    <path d="M15 13a3 3 0 1 0-6 0" />
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />
                    <circle cx="12" cy="8" r="2" />
                  </svg>
                }
                <span class="vdocs:flex vdocs:min-w-0 vdocs:flex-col">
                  <span class="vdocs:text-[13px] vdocs:font-medium vdocs:text-ink">{{ suggestionName(suggestion) }}</span>
                  @if (suggestion.email) {
                    <span class="vdocs:truncate vdocs:text-xs vdocs:text-muted">{{ suggestion.email }}</span>
                  }
                  @if (suggestion.phone) {
                    <span class="vdocs:truncate vdocs:text-xs vdocs:text-muted">{{ suggestion.phone }}</span>
                  }
                </span>
              </button>
            }
          </div>
        }
      </div>

      <div
        class="vdocs:mt-2.5 vdocs:flex vdocs:shrink-0 vdocs:flex-row vdocs:gap-2.5 vdocs:border-0 vdocs:border-t vdocs:border-solid vdocs:border-edge-light vdocs:pt-3">
        @if (showCancel()) {
          <verdocs-button variant="text" label="Cancel" size="small" (click)="onCancel()" />
        }
        <verdocs-button label="Done" size="small" class="vdocs:flex-1" [disabled]="!canSubmit()" (click)="onSubmit()" />
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
   * organization's entitlements. All five methods are always listed; the ones missing here
   * are shown locked. Include 'sms' to enable SMS verification (that also shows the phone
   * field), and 'kba' or 'id' if the account has those entitlements.
   */
  readonly availableAuthMethods = input<TRecipientAuthMethod[]>([ 'passcode', 'email' ]);
  /** Whether to show a Cancel button beside Done. Hosts with their own way out turn it off. */
  readonly showCancel = input(true);

  /** Emitted as the user types in a name field. Use the query to refresh `suggestions`. */
  readonly searchContacts = output<string>();
  /** Emitted with the completed contact details when the user clicks Done. */
  readonly submit = output<IContactSelectEvent>();
  /** Emitted when the user clicks Cancel. */
  readonly cancel = output<void>();

  protected readonly fieldClasses = FIELD_CLASSES;
  protected readonly labelClasses = LABEL_CLASSES;
  protected readonly inputClasses = INPUT_CLASSES;
  protected readonly groupLabelClasses = GROUP_LABEL_CLASSES;
  protected readonly verificationOptions = VERIFICATION_OPTIONS;
  protected readonly signingOptions = SIGNING_OPTIONS;

  private readonly baseId = `vdocs-contact-picker-${nextPickerId++}`;
  protected readonly firstNameFieldId = `${this.baseId}-first-name`;
  protected readonly lastNameFieldId = `${this.baseId}-last-name`;
  protected readonly emailFieldId = `${this.baseId}-email`;
  protected readonly phoneFieldId = `${this.baseId}-phone`;
  protected readonly messageFieldId = `${this.baseId}-message`;
  protected readonly verificationLabelId = `${this.baseId}-verification`;
  protected readonly signingLabelId = `${this.baseId}-signing`;

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

  protected readonly matchingSuggestions = computed(() => {
    const firstName = this.firstName();
    return this.suggestions().filter(
      suggestion => !firstName || (suggestion.first_name || '').toLowerCase().includes(firstName.toLowerCase()));
  });

  protected readonly suggestionsOpen = computed(() => this.showSuggestions() && this.matchingSuggestions().length > 0);

  protected readonly signingOption = computed<TSigningOption>(() => (this.delegator() ? 'delegator' : this.nameLocked() ? 'name_locked' : 'none'));

  // Every method the sender switched on has to be satisfied before we can submit, so a
  // passcode with no code or SMS with no phone blocks Done rather than riding along behind
  // a method that happens to be complete.
  protected readonly canSubmit = computed(() => {
    const hasBasics = !!this.firstName() && !!this.lastName() && isValidEmail(this.email());
    const hasAuthRequirements = this.authMethods().every(method => {
      switch (method) {
        case 'passcode':
          return !!this.passcode();
        case 'kba':
          return !!this.firstName() && !!this.lastName();
        case 'email':
          return !!this.email();
        case 'sms':
          return !!this.phone();
        default:
          return true;
      }
    });

    return hasBasics && hasAuthRequirements;
  });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly body = viewChild<ElementRef<HTMLDivElement>>('body');
  private readonly namesRow = viewChild<ElementRef<HTMLDivElement>>('namesRow');
  private readonly suggestionList = viewChild<ElementRef<HTMLDivElement>>('suggestionList');

  constructor() {
    // The suggestion list floats over the form instead of adding to the body's scroll height,
    // so it sits under the name row by measurement rather than by document order. Both the fade
    // and the offset are layout facts, available only after a render.
    afterEveryRender(() => {
      const body = this.body()?.nativeElement;
      updateScrollFade(body);

      const namesRow = this.namesRow()?.nativeElement;
      const list = this.suggestionList()?.nativeElement;
      if (body && namesRow && list) {
        list.style.top = `${namesRow.offsetTop + namesRow.offsetHeight - body.scrollTop + 4}px`;
      }
    });
  }

  protected inputValue(event: Event) {
    return (event.target as HTMLInputElement | HTMLTextAreaElement).value;
  }

  protected isLocked(method: TRecipientAuthMethod) {
    return !this.availableAuthMethods().includes(method);
  }

  // A locked pill that is already selected stays clickable, otherwise the sender could never
  // clear a method their plan has since dropped.
  protected pillClasses(selected: boolean, locked: boolean) {
    const state = selected ?
      'vdocs:border-accent vdocs:bg-accent-tint vdocs:text-accent' :
      'vdocs:border-edge vdocs:bg-surface vdocs:text-muted';
    const dimmed = locked ? 'vdocs:opacity-50' : '';
    const cursor = locked && !selected ? 'vdocs:cursor-default' : 'vdocs:cursor-pointer';
    return `${PILL_CLASSES} ${state} ${dimmed} ${cursor}`;
  }

  protected onBodyScroll(event: Event) {
    updateScrollFade(event.currentTarget as HTMLElement);
    this.showSuggestions.set(false);
  }

  protected onDocumentClick(event: MouseEvent) {
    if (this.showSuggestions() && !this.host.nativeElement.contains(event.target as Node)) {
      this.showSuggestions.set(false);
    }
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

  protected toggleAuthMethod(method: TRecipientAuthMethod) {
    const selected = this.authMethods();
    this.authMethods.set(selected.includes(method) ? selected.filter(entry => entry !== method) : [ ...selected, method ]);
  }

  protected setSigningOption(option: TSigningOption) {
    this.delegator.set(option === 'delegator');
    this.nameLocked.set(option === 'name_locked');
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
