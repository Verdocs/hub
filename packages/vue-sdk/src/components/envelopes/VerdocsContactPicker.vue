<script lang="ts">
import type { IProfile, IRecipient, TRecipientAuthMethod } from '@verdocs/js-sdk';

/** A contact suggestion, typically a recent recipient or an address-book entry. */
export type TPickerContact = Partial<IProfile>;

/** The completed recipient details, reported through the submit event. */
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

export interface VerdocsContactPickerProps {
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
</script>

<script setup lang="ts">
import { computed, ref, useId } from 'vue';
import { formatFullName, isValidEmail } from '@verdocs/js-sdk';
import VerdocsCheckbox from '../../controls/VerdocsCheckbox.vue';
import VerdocsButton from '../../controls/VerdocsButton.vue';
import VerdocsPortal from '../../controls/VerdocsPortal.vue';

const { templateRole = null, suggestions = [], availableAuthMethods = [ 'passcode', 'email' ] } = defineProps<VerdocsContactPickerProps>();

const emit = defineEmits<{
  /** Fired as the user types in a name field. Use the query to refresh `suggestions`. React's onSearchContacts. */
  searchContacts: [query: string];
  /** Fired with the completed contact details when the user clicks OK. React's onSubmit. */
  submit: [contact: IContactSelectEvent];
  /** Fired when the user clicks Cancel. React's onCancel. */
  cancel: [];
}>();

const firstName = ref(templateRole?.first_name || '');
const lastName = ref(templateRole?.last_name || '');
const email = ref(templateRole?.email || '');
const phone = ref(templateRole?.phone || '');
const message = ref(templateRole?.message || '');
const delegator = ref(templateRole?.delegator || false);
// delegator and name_locked are mutually exclusive; delegator takes precedence if both are somehow set.
const nameLocked = ref(templateRole?.delegator ? false : templateRole?.name_locked || false);
const authMethods = ref<TRecipientAuthMethod[]>(templateRole?.auth_methods || []);
const passcode = ref(templateRole?.passcode || '');
const showSuggestions = ref(false);

const namesRow = ref<HTMLDivElement | null>(null);

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

const hasSms = computed(() => availableAuthMethods.includes('sms'));
const verificationOptions = computed(() => VERIFICATION_OPTIONS.filter(option => availableAuthMethods.includes(option.value)));

const matchingSuggestions = computed(() =>
  suggestions.filter(suggestion => !firstName.value || (suggestion.first_name || '').toLowerCase().includes(firstName.value.toLowerCase())));
const suggestionsOpen = computed(() => showSuggestions.value && matchingSuggestions.value.length > 0);

const hasBasics = computed(() => !!firstName.value && !!lastName.value && isValidEmail(email.value));
const hasAuthRequirements = computed(() =>
  !authMethods.value.length
  || (authMethods.value.includes('passcode') && !!passcode.value)
  || (authMethods.value.includes('kba') && !!firstName.value && !!lastName.value)
  || (authMethods.value.includes('email') && !!email.value)
  || (authMethods.value.includes('sms') && !!phone.value));
const canSubmit = computed(() => hasBasics.value && hasAuthRequirements.value);

const handleFirstNameInput = (event: Event) => {
  const value = (event.target as HTMLInputElement).value;
  firstName.value = value;
  showSuggestions.value = true;
  emit('searchContacts', value);
};

const handleLastNameInput = (event: Event) => {
  const value = (event.target as HTMLInputElement).value;
  lastName.value = value;
  showSuggestions.value = true;
  emit('searchContacts', value);
};

const handlePhoneInput = (event: Event) => {
  phone.value = convertToE164((event.target as HTMLInputElement).value);
};

const handleSelectSuggestion = (suggestion: TPickerContact) => {
  firstName.value = suggestion.first_name || '';
  lastName.value = suggestion.last_name || '';
  email.value = suggestion.email || '';
  phone.value = suggestion.phone || '';
  showSuggestions.value = false;
};

const handleToggleAuthMethod = (method: TRecipientAuthMethod, checked: boolean) => {
  authMethods.value = checked ? [ ...authMethods.value, method ] : authMethods.value.filter(selected => selected !== method);
};

const handleToggleDelegator = (checked: boolean) => {
  delegator.value = checked;
  if (checked) {
    nameLocked.value = false;
  }
};

const handleToggleNameLocked = (checked: boolean) => {
  nameLocked.value = checked;
  if (checked) {
    delegator.value = false;
  }
};

const handleSubmit = () => {
  showSuggestions.value = false;
  emit('submit', {
    first_name: firstName.value,
    last_name: lastName.value,
    email: email.value,
    phone: phone.value,
    message: message.value,
    delegator: delegator.value,
    name_locked: nameLocked.value,
    auth_methods: authMethods.value,
    passcode: passcode.value,
  });
};

const handleCancel = () => {
  showSuggestions.value = false;
  emit('cancel');
};
</script>

<template>
  <form
    autocomplete="off"
    class="vdocs:box-border vdocs:flex vdocs:w-[300px] vdocs:flex-col vdocs:gap-3 vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:bg-canvas vdocs:p-3 vdocs:font-sans vdocs:shadow-[0_0_15px_0_rgba(0,0,0,0.1)]"
    @submit.prevent
  >
    <div class="vdocs:relative vdocs:flex vdocs:flex-row vdocs:items-start vdocs:gap-2">
      <label
        :for="firstNameFieldId"
        :class="LABEL_CLASSES"
      >
        Name:
      </label>
      <div
        ref="namesRow"
        class="vdocs:flex vdocs:min-w-0 vdocs:flex-1 vdocs:flex-row vdocs:gap-2"
      >
        <input
          :id="firstNameFieldId"
          :name="firstNameFieldId"
          type="text"
          aria-label="First name"
          data-lpignore="true"
          :value="firstName"
          placeholder="First..."
          :class="INPUT_CLASSES"
          @focus="showSuggestions = true"
          @input="handleFirstNameInput"
        >
        <input
          :id="lastNameFieldId"
          :name="lastNameFieldId"
          type="text"
          aria-label="Last name"
          data-lpignore="true"
          :value="lastName"
          placeholder="Last..."
          :class="INPUT_CLASSES"
          @focus="showSuggestions = true"
          @input="handleLastNameInput"
        >
      </div>

      <VerdocsPortal
        v-if="suggestionsOpen"
        :anchor="namesRow"
        @click-away="showSuggestions = false"
      >
        <div class="vdocs:max-h-[225px] vdocs:overflow-y-auto vdocs:bg-surface vdocs:font-sans vdocs:shadow-[0_0_15px_0_rgba(0,0,0,0.1)]">
          <button
            v-for="suggestion in matchingSuggestions"
            :key="suggestion.id ?? suggestion.email"
            type="button"
            class="vdocs:flex vdocs:w-full vdocs:cursor-pointer vdocs:flex-row vdocs:items-center vdocs:border-none vdocs:bg-transparent vdocs:px-3 vdocs:py-1.5 vdocs:text-left vdocs:font-sans vdocs:hover:bg-canvas"
            @click="handleSelectSuggestion(suggestion)"
          >
            <img
              v-if="suggestion.picture"
              alt=""
              :src="suggestion.picture"
              class="vdocs:mr-2 vdocs:size-8 vdocs:shrink-0 vdocs:rounded-full"
            >
            <svg
              v-else
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
              class="vdocs:mr-2 vdocs:size-8 vdocs:shrink-0 vdocs:text-muted"
            >
              <path d="M15 13a3 3 0 1 0-6 0" />
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />
              <circle
                cx="12"
                cy="8"
                r="2"
              />
            </svg>
            <span class="vdocs:flex vdocs:flex-col">
              <span class="vdocs:mb-[3px] vdocs:text-base vdocs:font-medium vdocs:text-ink">
                {{ formatFullName(suggestion) }}
              </span>
              <span
                v-if="suggestion.email"
                class="vdocs:mb-[3px] vdocs:text-sm vdocs:text-muted"
              >
                {{ suggestion.email }}
              </span>
              <span
                v-if="suggestion.phone"
                class="vdocs:mb-[3px] vdocs:text-sm vdocs:text-muted"
              >
                {{ suggestion.phone }}
              </span>
            </span>
          </button>
        </div>
      </VerdocsPortal>
    </div>

    <div class="vdocs:flex vdocs:flex-row vdocs:items-start vdocs:gap-2">
      <label
        :for="emailFieldId"
        :class="LABEL_CLASSES"
      >
        Email:
      </label>
      <input
        :id="emailFieldId"
        v-model="email"
        :name="emailFieldId"
        type="text"
        data-lpignore="true"
        placeholder="Invite/verify via email..."
        :class="INPUT_CLASSES"
        @focus="showSuggestions = false"
      >
    </div>

    <div
      v-if="hasSms"
      class="vdocs:flex vdocs:flex-row vdocs:items-start vdocs:gap-2"
    >
      <label
        :for="phoneFieldId"
        :class="LABEL_CLASSES"
      >
        Phone:
      </label>
      <input
        :id="phoneFieldId"
        :name="phoneFieldId"
        type="text"
        data-lpignore="true"
        :value="phone"
        placeholder="Invite/verify via SMS..."
        :class="INPUT_CLASSES"
        @focus="showSuggestions = false"
        @input="handlePhoneInput"
      >
    </div>

    <div
      v-if="verificationOptions.length > 0"
      class="vdocs:flex vdocs:flex-row vdocs:items-start vdocs:gap-2"
    >
      <div :class="LABEL_CLASSES">
        Verification Methods:
      </div>
      <div class="vdocs:flex vdocs:flex-col">
        <div
          v-for="option in verificationOptions"
          :key="option.value"
          class="vdocs:flex vdocs:flex-row vdocs:items-center vdocs:whitespace-nowrap vdocs:px-2 vdocs:py-[5px]"
        >
          <VerdocsCheckbox
            size="small"
            :label="option.label"
            :checked="authMethods.includes(option.value)"
            @update:checked="handleToggleAuthMethod(option.value, $event)"
          />
        </div>
      </div>
    </div>

    <div
      v-if="authMethods.includes('passcode')"
      class="vdocs:flex vdocs:flex-row vdocs:items-start vdocs:gap-2"
    >
      <label
        :for="passcodeFieldId"
        :class="LABEL_CLASSES"
      >
        Passcode:
      </label>
      <input
        :id="passcodeFieldId"
        v-model="passcode"
        :name="passcodeFieldId"
        type="text"
        data-lpignore="true"
        placeholder="4-8 digits recommended..."
        :class="INPUT_CLASSES"
        @focus="showSuggestions = false"
      >
    </div>

    <div class="vdocs:flex vdocs:flex-row vdocs:items-start vdocs:gap-2">
      <div :class="LABEL_CLASSES">
        Options:
      </div>
      <div class="vdocs:flex vdocs:flex-col">
        <div class="vdocs:flex vdocs:flex-row vdocs:items-center vdocs:whitespace-nowrap vdocs:px-2 vdocs:py-[5px]">
          <VerdocsCheckbox
            size="small"
            label="May delegate signing"
            :checked="delegator"
            :disabled="nameLocked"
            @update:checked="handleToggleDelegator"
          />
        </div>
        <div class="vdocs:flex vdocs:flex-row vdocs:items-center vdocs:whitespace-nowrap vdocs:px-2 vdocs:py-[5px]">
          <VerdocsCheckbox
            size="small"
            label="Name locked"
            :checked="nameLocked"
            :disabled="delegator"
            @update:checked="handleToggleNameLocked"
          />
        </div>
      </div>
    </div>

    <div class="vdocs:flex vdocs:flex-row vdocs:items-start vdocs:gap-2">
      <label
        :for="messageFieldId"
        :class="LABEL_CLASSES"
      >
        Message:
      </label>
      <textarea
        :id="messageFieldId"
        v-model="message"
        :name="messageFieldId"
        rows="3"
        data-lpignore="true"
        placeholder="Optional message to include in invitation..."
        :class="[INPUT_CLASSES, 'vdocs:resize-y']"
        @focus="showSuggestions = false"
      />
    </div>

    <div class="vdocs:mt-2 vdocs:flex vdocs:flex-row vdocs:justify-end vdocs:gap-1.5">
      <VerdocsButton
        variant="outline"
        label="Cancel"
        size="small"
        @click="handleCancel"
      />
      <VerdocsButton
        label="OK"
        size="small"
        :disabled="!canSubmit"
        @click="handleSubmit"
      />
    </div>
  </form>
</template>
