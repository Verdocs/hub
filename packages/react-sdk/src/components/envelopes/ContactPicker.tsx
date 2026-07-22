import { useId, useRef, useState } from 'react';
import { formatFullName, isValidEmail } from '@verdocs/js-sdk';
import type { IProfile, IRecipient, TRecipientAuthMethod } from '@verdocs/js-sdk';
import Checkbox from '../../controls/Checkbox';
import Button from '../../controls/Button';
import Portal from '../../controls/Portal';

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
   * organization's entitlements. Passcode and email are always available; include 'sms'
   * to enable SMS verification (this also shows the phone row), and 'kba' or 'id' if the
   * account has those entitlements.
   */
  availableAuthMethods?: TRecipientAuthMethod[];
  /** Called as the user types in a name field. Use the query to refresh `suggestions`. */
  onSearchContacts?: (query: string) => void;
  /** Called with the completed contact details when the user clicks OK. */
  onSubmit?: (contact: IContactSelectEvent) => void;
  /** Called when the user clicks Cancel. */
  onCancel?: () => void;
}

const LABEL_CLASSES = 'vdocs:flex vdocs:flex-[0_0_80px] vdocs:pt-1.5 vdocs:text-[13px] vdocs:font-medium vdocs:text-muted';

const INPUT_CLASSES =
  'vdocs:min-w-0 vdocs:flex-1 vdocs:box-border vdocs:rounded-ctl vdocs:border vdocs:border-solid vdocs:border-edge vdocs:bg-surface '
  + 'vdocs:p-1.5 vdocs:font-sans vdocs:text-sm vdocs:text-ink vdocs:outline-none vdocs:placeholder:text-edge vdocs:focus:border-accent';

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

/**
 * A contact entry form for filling out Recipient objects when sending envelopes.
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

  const namesRowRef = useRef<HTMLDivElement>(null);

  // Unique ids double as field names. Browsers frequently ignore autocomplete="off" and
  // stack their own autofill pickers on top of our suggestions, but they cannot match
  // saved entries against names that change every mount.
  const baseId = useId();
  const firstNameFieldId = `${baseId}-first-name`;
  const lastNameFieldId = `${baseId}-last-name`;
  const emailFieldId = `${baseId}-email`;
  const phoneFieldId = `${baseId}-phone`;
  const passcodeFieldId = `${baseId}-passcode`;
  const messageFieldId = `${baseId}-message`;

  const hasSms = availableAuthMethods.includes('sms');
  const verificationOptions = VERIFICATION_OPTIONS.filter(option => availableAuthMethods.includes(option.value));

  const matchingSuggestions = suggestions.filter(suggestion => !firstName || (suggestion.first_name || '').toLowerCase().includes(firstName.toLowerCase()));
  const suggestionsOpen = showSuggestions && matchingSuggestions.length > 0;

  const hasBasics = !!firstName && !!lastName && isValidEmail(email);
  const hasAuthRequirements =
    !authMethods.length
    || (authMethods.includes('passcode') && !!passcode)
    || (authMethods.includes('kba') && !!firstName && !!lastName)
    || (authMethods.includes('email') && !!email)
    || (authMethods.includes('sms') && !!phone);
  const canSubmit = hasBasics && hasAuthRequirements;

  const handleSelectSuggestion = (suggestion: TPickerContact) => {
    setFirstName(suggestion.first_name || '');
    setLastName(suggestion.last_name || '');
    setEmail(suggestion.email || '');
    setPhone(suggestion.phone || '');
    setShowSuggestions(false);
  };

  const handleToggleAuthMethod = (method: TRecipientAuthMethod, checked: boolean) => {
    setAuthMethods(checked ? [ ...authMethods, method ] : authMethods.filter(selected => selected !== method));
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
      autoComplete="off"
      onSubmit={e => e.preventDefault()}
      className="vdocs:box-border vdocs:flex vdocs:w-[300px] vdocs:flex-col vdocs:gap-3 vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:bg-canvas vdocs:p-3 vdocs:font-sans vdocs:shadow-[0_0_15px_0_rgba(0,0,0,0.1)]">
      <div className="vdocs:relative vdocs:flex vdocs:flex-row vdocs:items-start vdocs:gap-2">
        <label htmlFor={firstNameFieldId} className={LABEL_CLASSES}>
          Name:
        </label>
        <div ref={namesRowRef} className="vdocs:flex vdocs:min-w-0 vdocs:flex-1 vdocs:flex-row vdocs:gap-2">
          <input
            id={firstNameFieldId}
            name={firstNameFieldId}
            type="text"
            aria-label="First name"
            data-lpignore="true"
            value={firstName}
            placeholder="First..."
            className={INPUT_CLASSES}
            onFocus={() => setShowSuggestions(true)}
            onChange={e => {
              setFirstName(e.target.value);
              setShowSuggestions(true);
              onSearchContacts?.(e.target.value);
            }}
          />
          <input
            id={lastNameFieldId}
            name={lastNameFieldId}
            type="text"
            aria-label="Last name"
            data-lpignore="true"
            value={lastName}
            placeholder="Last..."
            className={INPUT_CLASSES}
            onFocus={() => setShowSuggestions(true)}
            onChange={e => {
              setLastName(e.target.value);
              setShowSuggestions(true);
              onSearchContacts?.(e.target.value);
            }}
          />
        </div>

        {suggestionsOpen && (
          <Portal anchor={namesRowRef} onClickAway={() => setShowSuggestions(false)}>
            <div className="vdocs:max-h-[225px] vdocs:overflow-y-auto vdocs:bg-surface vdocs:font-sans vdocs:shadow-[0_0_15px_0_rgba(0,0,0,0.1)]">
              {matchingSuggestions.map(suggestion => (
                <button
                  key={suggestion.id ?? suggestion.email}
                  type="button"
                  onClick={() => handleSelectSuggestion(suggestion)}
                  className="vdocs:flex vdocs:w-full vdocs:cursor-pointer vdocs:flex-row vdocs:items-center vdocs:border-none vdocs:bg-transparent vdocs:px-3 vdocs:py-1.5 vdocs:text-left vdocs:font-sans vdocs:hover:bg-canvas">
                  {suggestion.picture ? (
                    <img alt="" src={suggestion.picture} className="vdocs:mr-2 vdocs:size-8 vdocs:shrink-0 vdocs:rounded-full" />
                  ) : (
                    <AddressBookIcon className="vdocs:mr-2 vdocs:size-8 vdocs:shrink-0 vdocs:text-muted" />
                  )}
                  <span className="vdocs:flex vdocs:flex-col">
                    <span className="vdocs:mb-[3px] vdocs:text-base vdocs:font-medium vdocs:text-ink">
                      {formatFullName(suggestion)}
                    </span>
                    {suggestion.email && (
                      <span className="vdocs:mb-[3px] vdocs:text-sm vdocs:text-muted">
                        {suggestion.email}
                      </span>
                    )}
                    {suggestion.phone && (
                      <span className="vdocs:mb-[3px] vdocs:text-sm vdocs:text-muted">
                        {suggestion.phone}
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </Portal>
        )}
      </div>

      <div className="vdocs:flex vdocs:flex-row vdocs:items-start vdocs:gap-2">
        <label htmlFor={emailFieldId} className={LABEL_CLASSES}>
          Email:
        </label>
        <input
          id={emailFieldId}
          name={emailFieldId}
          type="text"
          data-lpignore="true"
          value={email}
          placeholder="Invite/verify via email..."
          className={INPUT_CLASSES}
          onFocus={() => setShowSuggestions(false)}
          onChange={e => setEmail(e.target.value)}
        />
      </div>

      {hasSms && (
        <div className="vdocs:flex vdocs:flex-row vdocs:items-start vdocs:gap-2">
          <label htmlFor={phoneFieldId} className={LABEL_CLASSES}>
            Phone:
          </label>
          <input
            id={phoneFieldId}
            name={phoneFieldId}
            type="text"
            data-lpignore="true"
            value={phone}
            placeholder="Invite/verify via SMS..."
            className={INPUT_CLASSES}
            onFocus={() => setShowSuggestions(false)}
            onChange={e => setPhone(convertToE164(e.target.value))}
          />
        </div>
      )}

      {verificationOptions.length > 0 && (
        <div className="vdocs:flex vdocs:flex-row vdocs:items-start vdocs:gap-2">
          <div className={LABEL_CLASSES}>
            Verification Methods:
          </div>
          <div className="vdocs:flex vdocs:flex-col">
            {verificationOptions.map(option => (
              <div key={option.value} className="vdocs:flex vdocs:flex-row vdocs:items-center vdocs:whitespace-nowrap vdocs:px-2 vdocs:py-[5px]">
                <Checkbox
                  size="small"
                  label={option.label}
                  checked={authMethods.includes(option.value)}
                  onChange={e => handleToggleAuthMethod(option.value, e.target.checked)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {authMethods.includes('passcode') && (
        <div className="vdocs:flex vdocs:flex-row vdocs:items-start vdocs:gap-2">
          <label htmlFor={passcodeFieldId} className={LABEL_CLASSES}>
            Passcode:
          </label>
          <input
            id={passcodeFieldId}
            name={passcodeFieldId}
            type="text"
            data-lpignore="true"
            value={passcode}
            placeholder="4-8 digits recommended..."
            className={INPUT_CLASSES}
            onFocus={() => setShowSuggestions(false)}
            onChange={e => setPasscode(e.target.value)}
          />
        </div>
      )}

      <div className="vdocs:flex vdocs:flex-row vdocs:items-start vdocs:gap-2">
        <div className={LABEL_CLASSES}>
          Options:
        </div>
        <div className="vdocs:flex vdocs:flex-col">
          <div className="vdocs:flex vdocs:flex-row vdocs:items-center vdocs:whitespace-nowrap vdocs:px-2 vdocs:py-[5px]">
            <Checkbox
              size="small"
              label="May delegate signing"
              checked={delegator}
              disabled={nameLocked}
              onChange={e => {
                setDelegator(e.target.checked);
                if (e.target.checked) {
                  setNameLocked(false);
                }
              }}
            />
          </div>
          <div className="vdocs:flex vdocs:flex-row vdocs:items-center vdocs:whitespace-nowrap vdocs:px-2 vdocs:py-[5px]">
            <Checkbox
              size="small"
              label="Name locked"
              checked={nameLocked}
              disabled={delegator}
              onChange={e => {
                setNameLocked(e.target.checked);
                if (e.target.checked) {
                  setDelegator(false);
                }
              }}
            />
          </div>
        </div>
      </div>

      <div className="vdocs:flex vdocs:flex-row vdocs:items-start vdocs:gap-2">
        <label htmlFor={messageFieldId} className={LABEL_CLASSES}>
          Message:
        </label>
        <textarea
          id={messageFieldId}
          name={messageFieldId}
          rows={3}
          data-lpignore="true"
          value={message}
          placeholder="Optional message to include in invitation..."
          className={`${INPUT_CLASSES} vdocs:resize-y`}
          onFocus={() => setShowSuggestions(false)}
          onChange={e => setMessage(e.target.value)}
        />
      </div>

      <div className="vdocs:mt-2 vdocs:flex vdocs:flex-row vdocs:justify-end vdocs:gap-1.5">
        <Button
          variant="outline"
          label="Cancel"
          size="small"
          onClick={() => {
            setShowSuggestions(false);
            onCancel?.();
          }}
        />
        <Button label="OK" size="small" disabled={!canSubmit} onClick={handleSubmit} />
      </div>
    </form>
  );
}
