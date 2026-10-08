import { useEffect, useId, useRef, useState } from 'react';
import { formatFullName, isValidEmail } from '@verdocs/js-sdk';
import type { IProfile, IRecipient, TRecipientAuthMethod } from '@verdocs/js-sdk';
import { LockClosedIcon } from '../../controls/icons';
import Button from '../../controls/Button';

/** A contact suggestion, typically a recent recipient or an address-book entry. */
export type TPickerContact = Partial<IProfile>;

/** The completed recipient details, reported through onSubmit. */
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

export interface ContactPickerProps {
  /** The role this contact will be assigned to. Pre-fills the form fields. */
  templateRole?: Partial<IRecipient> | null;
  /**
   * If set, suggestions will be displayed in a drop-down list as the user types in the
   * name fields. It is recommended that this be limited to the 5 best matching records.
   */
  suggestions?: TPickerContact[];
  /**
   * The verification methods the sender's account may offer, typically derived from the
   * organization's entitlements. All five methods are always listed; the ones missing here
   * are shown locked. Include 'sms' to enable SMS verification (that also shows the phone
   * field), and 'kba' or 'id' if the account has those entitlements.
   */
  availableAuthMethods?: TRecipientAuthMethod[];
  /** Whether to show a Cancel button beside Done. Hosts with their own way out turn it off. */
  showCancel?: boolean;
  /** Called as the user types in a name field. Use the query to refresh `suggestions`. */
  onSearchContacts?: (query: string) => void;
  /** Called with the completed contact details when the user clicks Done. */
  onSubmit?: (contact: IContactSelectEvent) => void;
  /** Called when the user clicks Cancel. */
  onCancel?: () => void;
}

type TSigningOption = 'none' | 'delegator' | 'name_locked';

const FIELD_CLASSES = 'vdocs:mb-2.5 vdocs:flex vdocs:flex-col vdocs:gap-1';

const LABEL_CLASSES = 'vdocs:text-xs vdocs:font-medium vdocs:text-ink';

const INPUT_CLASSES =
  'vdocs:box-border vdocs:w-full vdocs:rounded-ctl vdocs:border vdocs:border-solid vdocs:border-edge vdocs:bg-surface vdocs:px-2.5 '
  + 'vdocs:font-sans vdocs:text-[13px] vdocs:text-ink vdocs:outline-none vdocs:placeholder:text-edge '
  + 'vdocs:focus:border-accent vdocs:focus:ring-2 vdocs:focus:ring-accent-tint-dark';

const GROUP_LABEL_CLASSES = 'vdocs:mb-1.5 vdocs:text-xs vdocs:font-medium vdocs:text-ink';

const PILL_CLASSES =
  'vdocs:inline-flex vdocs:h-[26px] vdocs:items-center vdocs:gap-1 vdocs:whitespace-nowrap vdocs:rounded-full vdocs:border '
  + 'vdocs:border-solid vdocs:px-2.5 vdocs:font-sans vdocs:text-xs vdocs:font-medium vdocs:outline-none '
  + 'vdocs:focus-visible:outline-2 vdocs:focus-visible:outline-offset-2 vdocs:focus-visible:outline-accent';

const VERIFICATION_OPTIONS: { value: TRecipientAuthMethod; label: string }[] = [
  { value: 'email', label: 'Email' },
  { value: 'passcode', label: 'Passcode' },
  { value: 'sms', label: 'SMS code' },
  { value: 'kba', label: 'KBA' },
  { value: 'id', label: 'ID check' },
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

// Show the bottom fade only while there is more content below the fold. The class goes
// straight onto the DOM rather than into state, so calling this after every render and on
// every scroll event cannot loop or thrash React.
const updateScrollFade = (body: HTMLElement | null) => {
  const wrap = body?.parentElement;
  if (!body || !wrap) {
    return;
  }

  const scrollable = body.scrollHeight > body.clientHeight + 1;
  const atEnd = body.scrollTop + body.clientHeight >= body.scrollHeight - 1;
  wrap.classList.toggle('vdocs-scroll-more', scrollable && !atEnd);
};

function AddressBookIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}>
      <path d="M15 13a3 3 0 1 0-6 0" />
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />
      <circle cx="12" cy="8" r="2" />
    </svg>
  );
}

interface PillProps {
  label: string;
  selected: boolean;
  locked?: boolean;
  onClick: () => void;
}

// A locked pill that is already selected stays clickable, otherwise the sender could never
// clear a method their plan has since dropped.
function Pill({ label, selected, locked = false, onClick }: PillProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={locked && !selected}
      title={locked ? 'Not included in your plan' : undefined}
      onClick={onClick}
      className={`${PILL_CLASSES} ${
        selected ? 'vdocs:border-accent vdocs:bg-accent-tint vdocs:text-accent' : 'vdocs:border-edge vdocs:bg-surface vdocs:text-muted'
      } ${locked ? 'vdocs:opacity-50' : ''} ${locked && !selected ? 'vdocs:cursor-default' : 'vdocs:cursor-pointer'}`}>
      {locked && <LockClosedIcon className="vdocs:size-3 vdocs:shrink-0" />}
      {label}
    </button>
  );
}

/**
 * A contact entry form for filling out Recipient objects when sending envelopes.
 *
 * The picker carries no card chrome of its own: the host supplies the surface and, when it
 * constrains the height, the fields scroll above a pinned Done button.
 *
 * The picker can provide address-book style suggestions: as the user types in the name
 * fields the current text is reported via `onSearchContacts`, and the caller may update
 * the `suggestions` prop with matching contacts (or pre-seed it with entries such as
 * recently-used contacts). Selecting a suggestion fills the form.
 */
export default function ContactPicker({
  templateRole = null,
  suggestions = [],
  availableAuthMethods = [ 'passcode', 'email' ],
  showCancel = true,
  onSearchContacts,
  onSubmit,
  onCancel,
}: ContactPickerProps) {
  const [firstName, setFirstName] = useState(templateRole?.first_name || '');
  const [lastName, setLastName] = useState(templateRole?.last_name || '');
  const [email, setEmail] = useState(templateRole?.email || '');
  const [phone, setPhone] = useState(templateRole?.phone || '');
  const [message, setMessage] = useState(templateRole?.message || '');
  const [delegator, setDelegator] = useState(templateRole?.delegator || false);
  // delegator and name_locked are mutually exclusive; delegator takes precedence if both are somehow set
  const [nameLocked, setNameLocked] = useState(templateRole?.delegator ? false : templateRole?.name_locked || false);
  const [authMethods, setAuthMethods] = useState<TRecipientAuthMethod[]>(templateRole?.auth_methods || []);
  const [passcode, setPasscode] = useState(templateRole?.passcode || '');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const rootRef = useRef<HTMLFormElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const namesRowRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Unique ids double as field names. Browsers frequently ignore autocomplete="off" and
  // stack their own autofill pickers on top of our suggestions, but they cannot match
  // saved entries against names that change every mount.
  const baseId = useId();
  const firstNameFieldId = `${baseId}-first-name`;
  const lastNameFieldId = `${baseId}-last-name`;
  const emailFieldId = `${baseId}-email`;
  const phoneFieldId = `${baseId}-phone`;
  const messageFieldId = `${baseId}-message`;
  const verificationLabelId = `${baseId}-verification`;
  const signingLabelId = `${baseId}-signing`;

  const hasSms = availableAuthMethods.includes('sms');

  const matchingSuggestions = suggestions.filter(suggestion => !firstName || (suggestion.first_name || '').toLowerCase().includes(firstName.toLowerCase()));
  const suggestionsOpen = showSuggestions && matchingSuggestions.length > 0;

  const hasBasics = !!firstName && !!lastName && isValidEmail(email);
  // Each selected method gates Done on its own, since every one of them has to be usable at
  // signing time: a filled email cannot stand in for a passcode the sender never typed. 'id'
  // needs nothing from this form, so it falls through to true.
  const hasAuthRequirements = authMethods.every(method => {
    switch (method) {
      case 'passcode':
        return !!passcode;
      case 'sms':
        return !!phone;
      case 'email':
        return !!email;
      case 'kba':
        return !!firstName && !!lastName;
      default:
        return true;
    }
  });
  const canSubmit = hasBasics && hasAuthRequirements;

  const signingOption: TSigningOption = delegator ? 'delegator' : nameLocked ? 'name_locked' : 'none';

  // The suggestion list is a sibling of the scrolling body so it floats over the form instead
  // of adding to the body's scroll height, which means we place it under the name row by hand.
  // Both measurements only exist after layout, so this runs on every render.
  useEffect(() => {
    updateScrollFade(bodyRef.current);

    const body = bodyRef.current;
    const namesRow = namesRowRef.current;
    const list = suggestionsRef.current;
    if (body && namesRow && list) {
      list.style.top = `${namesRow.offsetTop + namesRow.offsetHeight - body.scrollTop + 4}px`;
    }
  });

  useEffect(() => {
    if (!suggestionsOpen) {
      return;
    }

    const handleClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [suggestionsOpen]);

  const handleSelectSuggestion = (suggestion: TPickerContact) => {
    setFirstName(suggestion.first_name || '');
    setLastName(suggestion.last_name || '');
    setEmail(suggestion.email || '');
    setPhone(suggestion.phone || '');
    setShowSuggestions(false);
  };

  const handleToggleAuthMethod = (method: TRecipientAuthMethod) => {
    setAuthMethods(authMethods.includes(method) ? authMethods.filter(selected => selected !== method) : [ ...authMethods, method ]);
  };

  const handleSetSigningOption = (option: TSigningOption) => {
    setDelegator(option === 'delegator');
    setNameLocked(option === 'name_locked');
  };

  const handleSubmit = () => {
    setShowSuggestions(false);
    onSubmit?.({
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      message,
      delegator,
      name_locked: nameLocked,
      auth_methods: authMethods,
      passcode,
    });
  };

  return (
    <form
      ref={rootRef}
      autoComplete="off"
      onSubmit={e => e.preventDefault()}
      className="vdocs:box-border vdocs:flex vdocs:min-h-0 vdocs:flex-1 vdocs:flex-col vdocs:font-sans vdocs:text-ink">
      <div className="vdocs:group vdocs:relative vdocs:flex vdocs:min-h-0 vdocs:flex-1 vdocs:flex-col">
        <div
          ref={bodyRef}
          className="vdocs:relative vdocs:min-h-0 vdocs:flex-1 vdocs:overflow-y-auto"
          onScroll={e => {
            updateScrollFade(e.currentTarget);
            setShowSuggestions(false);
          }}>
          <div ref={namesRowRef} className="vdocs:relative vdocs:flex vdocs:flex-row vdocs:gap-2">
            <div className={`${FIELD_CLASSES} vdocs:min-w-0 vdocs:flex-1`}>
              <label htmlFor={firstNameFieldId} className={LABEL_CLASSES}>
                First name
              </label>
              <input
                id={firstNameFieldId}
                name={firstNameFieldId}
                type="text"
                data-lpignore="true"
                value={firstName}
                className={`${INPUT_CLASSES} vdocs:h-[34px]`}
                onFocus={() => setShowSuggestions(true)}
                onChange={e => {
                  setFirstName(e.target.value);
                  setShowSuggestions(true);
                  onSearchContacts?.(e.target.value);
                }}
              />
            </div>
            <div className={`${FIELD_CLASSES} vdocs:min-w-0 vdocs:flex-1`}>
              <label htmlFor={lastNameFieldId} className={LABEL_CLASSES}>
                Last name
              </label>
              <input
                id={lastNameFieldId}
                name={lastNameFieldId}
                type="text"
                data-lpignore="true"
                value={lastName}
                className={`${INPUT_CLASSES} vdocs:h-[34px]`}
                onFocus={() => setShowSuggestions(true)}
                onChange={e => {
                  setLastName(e.target.value);
                  setShowSuggestions(true);
                  onSearchContacts?.(e.target.value);
                }}
              />
            </div>
          </div>

          <div className={FIELD_CLASSES}>
            <label htmlFor={emailFieldId} className={LABEL_CLASSES}>
              Email
            </label>
            <input
              id={emailFieldId}
              name={emailFieldId}
              type="text"
              data-lpignore="true"
              value={email}
              className={`${INPUT_CLASSES} vdocs:h-[34px]`}
              onFocus={() => setShowSuggestions(false)}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          {hasSms && (
            <div className={FIELD_CLASSES}>
              <label htmlFor={phoneFieldId} className={LABEL_CLASSES}>
                Phone
                {' '}
                <span className="vdocs:font-normal vdocs:text-muted">(optional)</span>
              </label>
              <input
                id={phoneFieldId}
                name={phoneFieldId}
                type="text"
                data-lpignore="true"
                value={phone}
                placeholder="+1 (555) 000-0000"
                className={`${INPUT_CLASSES} vdocs:h-[34px]`}
                onFocus={() => setShowSuggestions(false)}
                onChange={e => setPhone(convertToE164(e.target.value))}
              />
            </div>
          )}

          <div className="vdocs:mt-0.5 vdocs:mb-3">
            <div id={verificationLabelId} className={GROUP_LABEL_CLASSES}>
              Verification
            </div>
            <div role="group" aria-labelledby={verificationLabelId} className="vdocs:flex vdocs:flex-row vdocs:flex-wrap vdocs:gap-1.5">
              {VERIFICATION_OPTIONS.map(option => (
                <Pill
                  key={option.value}
                  label={option.label}
                  selected={authMethods.includes(option.value)}
                  locked={!availableAuthMethods.includes(option.value)}
                  onClick={() => handleToggleAuthMethod(option.value)}
                />
              ))}
            </div>

            {authMethods.includes('passcode') && (
              <div className="vdocs:mt-2 vdocs:flex vdocs:flex-row vdocs:items-center vdocs:gap-2">
                <input
                  type="text"
                  aria-label="Passcode"
                  data-lpignore="true"
                  value={passcode}
                  placeholder="4-8 digits"
                  className={`${INPUT_CLASSES} vdocs:h-[30px] vdocs:w-[120px] vdocs:shrink-0`}
                  onFocus={() => setShowSuggestions(false)}
                  onChange={e => setPasscode(e.target.value)}
                />
                <span className="vdocs:min-w-0 vdocs:flex-1 vdocs:self-center vdocs:text-[11px] vdocs:leading-[1.35] vdocs:text-muted">
                  PIN or passcode already known by the recipient
                </span>
              </div>
            )}
          </div>

          <div className="vdocs:mt-0.5 vdocs:mb-3">
            <div id={signingLabelId} className={GROUP_LABEL_CLASSES}>
              Signing options
            </div>
            <div role="group" aria-labelledby={signingLabelId} className="vdocs:flex vdocs:flex-row vdocs:flex-wrap vdocs:gap-1.5">
              <Pill label="None" selected={signingOption === 'none'} onClick={() => handleSetSigningOption('none')} />
              <Pill label="May delegate" selected={signingOption === 'delegator'} onClick={() => handleSetSigningOption('delegator')} />
              <Pill label="Name locked" selected={signingOption === 'name_locked'} onClick={() => handleSetSigningOption('name_locked')} />
            </div>
          </div>

          <div className={FIELD_CLASSES}>
            <label htmlFor={messageFieldId} className={LABEL_CLASSES}>
              Message
              {' '}
              <span className="vdocs:font-normal vdocs:text-muted">(optional)</span>
            </label>
            <textarea
              id={messageFieldId}
              name={messageFieldId}
              data-lpignore="true"
              value={message}
              placeholder="Add a message to the invitation"
              className={`${INPUT_CLASSES} vdocs:h-14 vdocs:resize-y vdocs:py-2`}
              onFocus={() => setShowSuggestions(false)}
              onChange={e => setMessage(e.target.value)}
            />
          </div>
        </div>

        <div
          aria-hidden="true"
          className="vdocs:pointer-events-none vdocs:absolute vdocs:inset-x-0 vdocs:bottom-0 vdocs:h-9 vdocs:bg-linear-to-b vdocs:from-surface/0 vdocs:to-surface vdocs:opacity-0 vdocs:transition-opacity vdocs:duration-150 vdocs:group-[.vdocs-scroll-more]:opacity-100"
        />

        {suggestionsOpen && (
          <div
            ref={suggestionsRef}
            className="vdocs:absolute vdocs:inset-x-0 vdocs:z-20 vdocs:max-h-[225px] vdocs:overflow-y-auto vdocs:rounded-ctl vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:bg-surface vdocs:font-sans vdocs:shadow-[0_8px_24px_0_rgba(9,44,76,0.14)]">
            {matchingSuggestions.map(suggestion => (
              <button
                key={suggestion.id ?? suggestion.email}
                type="button"
                onClick={() => handleSelectSuggestion(suggestion)}
                className="vdocs:flex vdocs:w-full vdocs:cursor-pointer vdocs:flex-row vdocs:items-center vdocs:border-none vdocs:bg-transparent vdocs:px-3 vdocs:py-1.5 vdocs:text-left vdocs:font-sans vdocs:hover:bg-accent-tint">
                {suggestion.picture ? (
                  <img alt="" src={suggestion.picture} className="vdocs:mr-2 vdocs:size-7 vdocs:shrink-0 vdocs:rounded-full" />
                ) : (
                  <AddressBookIcon className="vdocs:mr-2 vdocs:size-7 vdocs:shrink-0 vdocs:text-muted" />
                )}
                <span className="vdocs:flex vdocs:min-w-0 vdocs:flex-col">
                  <span className="vdocs:text-[13px] vdocs:font-medium vdocs:text-ink">
                    {formatFullName(suggestion)}
                  </span>
                  {suggestion.email && (
                    <span className="vdocs:truncate vdocs:text-xs vdocs:text-muted">
                      {suggestion.email}
                    </span>
                  )}
                  {suggestion.phone && (
                    <span className="vdocs:truncate vdocs:text-xs vdocs:text-muted">
                      {suggestion.phone}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="vdocs:mt-2.5 vdocs:flex vdocs:shrink-0 vdocs:flex-row vdocs:gap-2.5 vdocs:border-0 vdocs:border-t vdocs:border-solid vdocs:border-edge-light vdocs:pt-3">
        {showCancel && (
          <Button
            variant="text"
            label="Cancel"
            size="small"
            onClick={() => {
              setShowSuggestions(false);
              onCancel?.();
            }}
          />
        )}
        <Button label="Done" size="small" disabled={!canSubmit} className="vdocs:flex-1" onClick={handleSubmit} />
      </div>
    </form>
  );
}
