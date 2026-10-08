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
   * organization's entitlements. All five methods are always listed; the ones missing here
   * are shown locked. Include 'sms' to enable SMS verification (that also shows the phone
   * field), and 'kba' or 'id' if the account has those entitlements.
   */
  availableAuthMethods?: TRecipientAuthMethod[];
  /** Whether to show a Cancel button beside Done. Hosts with their own way out turn it off. */
  showCancel?: boolean;
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

const SELECTED_PILL_CLASSES = 'vdocs:border-accent vdocs:bg-accent-tint vdocs:text-accent';

const UNSELECTED_PILL_CLASSES = 'vdocs:border-edge vdocs:bg-surface vdocs:text-muted';

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
</script>

<script setup lang="ts">
import { computed, onMounted, onScopeDispose, onUpdated, ref, useId, watch } from 'vue';
import { formatFullName, isValidEmail } from '@verdocs/js-sdk';
import VerdocsLockClosedIcon from '../../controls/icons/VerdocsLockClosedIcon.vue';
import VerdocsButton from '../../controls/VerdocsButton.vue';

const {
  templateRole = null,
  suggestions = [],
  availableAuthMethods = [ 'passcode', 'email' ],
  showCancel = true,
} = defineProps<VerdocsContactPickerProps>();

const emit = defineEmits<{
  /** Fired as the user types in a name field. Use the query to refresh `suggestions`. React's onSearchContacts. */
  searchContacts: [query: string];
  /** Fired with the completed contact details when the user clicks Done. React's onSubmit. */
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

const root = ref<HTMLFormElement | null>(null);
const body = ref<HTMLDivElement | null>(null);
const namesRow = ref<HTMLDivElement | null>(null);
const suggestionList = ref<HTMLDivElement | null>(null);

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

const hasSms = computed(() => availableAuthMethods.includes('sms'));

const matchingSuggestions = computed(() =>
  suggestions.filter(suggestion => !firstName.value || (suggestion.first_name || '').toLowerCase().includes(firstName.value.toLowerCase())));
const suggestionsOpen = computed(() => showSuggestions.value && matchingSuggestions.value.length > 0);

const signingOption = computed<TSigningOption>(() => (delegator.value ? 'delegator' : nameLocked.value ? 'name_locked' : 'none'));

// Every method the sender switched on has to have what it needs to work, so a passcode with
// no code or SMS with no phone number leaves Done disabled. ID check collects nothing here.
const methodSatisfied = (method: TRecipientAuthMethod) => {
  switch (method) {
    case 'passcode':
      return !!passcode.value;
    case 'sms':
      return !!phone.value;
    case 'email':
      return !!email.value;
    case 'kba':
      return !!firstName.value && !!lastName.value;
    default:
      return true;
  }
};

const hasBasics = computed(() => !!firstName.value && !!lastName.value && isValidEmail(email.value));
const hasAuthRequirements = computed(() => authMethods.value.every(methodSatisfied));
const canSubmit = computed(() => hasBasics.value && hasAuthRequirements.value);

// A locked pill that is already selected stays clickable, otherwise the sender could never
// clear a method their plan has since dropped.
const pillClasses = (selected: boolean, locked: boolean) => [
  PILL_CLASSES,
  selected ? SELECTED_PILL_CLASSES : UNSELECTED_PILL_CLASSES,
  locked ? 'vdocs:opacity-50' : '',
  locked && !selected ? 'vdocs:cursor-default' : 'vdocs:cursor-pointer',
];

const verificationPills = computed(() =>
  VERIFICATION_OPTIONS.map(option => {
    const selected = authMethods.value.includes(option.value);
    const locked = !availableAuthMethods.includes(option.value);

    return { ...option, selected, locked, classes: pillClasses(selected, locked) };
  }));

const signingPills = computed(() =>
  SIGNING_OPTIONS.map(option => ({ ...option, selected: signingOption.value === option.value, classes: pillClasses(signingOption.value === option.value, false) })));

// Show the bottom fade only while there is more content below the fold, and keep the floating
// suggestion list under the name row. The class and the offset go straight onto the DOM rather
// than into refs, so running this after every render cannot loop.
const syncOverlays = () => {
  const bodyEl = body.value;
  const wrap = bodyEl?.parentElement;
  if (bodyEl && wrap) {
    const scrollable = bodyEl.scrollHeight > bodyEl.clientHeight + 1;
    const atEnd = bodyEl.scrollTop + bodyEl.clientHeight >= bodyEl.scrollHeight - 1;
    wrap.classList.toggle('vdocs-scroll-more', scrollable && !atEnd);
  }

  // The list is a sibling of the scrolling body so it floats over the form instead of adding to
  // the body's scroll height, which means we place it under the name row by hand.
  if (bodyEl && namesRow.value && suggestionList.value) {
    suggestionList.value.style.top = `${namesRow.value.offsetTop + namesRow.value.offsetHeight - bodyEl.scrollTop + 4}px`;
  }
};

onMounted(syncOverlays);
onUpdated(syncOverlays);

const handleDocumentClick = (e: MouseEvent) => {
  if (root.value && !root.value.contains(e.target as Node)) {
    showSuggestions.value = false;
  }
};

watch(suggestionsOpen, open => {
  if (open) {
    document.addEventListener('click', handleDocumentClick);
  } else {
    document.removeEventListener('click', handleDocumentClick);
  }
});

onScopeDispose(() => document.removeEventListener('click', handleDocumentClick));

const handleBodyScroll = () => {
  syncOverlays();
  showSuggestions.value = false;
};

const handleNameInput = (event: Event, field: 'first' | 'last') => {
  const value = (event.target as HTMLInputElement).value;
  if (field === 'first') {
    firstName.value = value;
  } else {
    lastName.value = value;
  }

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

const handleToggleAuthMethod = (method: TRecipientAuthMethod) => {
  authMethods.value = authMethods.value.includes(method) ? authMethods.value.filter(selected => selected !== method) : [ ...authMethods.value, method ];
};

const handleSetSigningOption = (option: TSigningOption) => {
  delegator.value = option === 'delegator';
  nameLocked.value = option === 'name_locked';
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
    ref="root"
    autocomplete="off"
    class="vdocs:box-border vdocs:flex vdocs:min-h-0 vdocs:flex-1 vdocs:flex-col vdocs:font-sans vdocs:text-ink"
    @submit.prevent
  >
    <div class="vdocs:group vdocs:relative vdocs:flex vdocs:min-h-0 vdocs:flex-1 vdocs:flex-col">
      <div
        ref="body"
        class="vdocs:relative vdocs:min-h-0 vdocs:flex-1 vdocs:overflow-y-auto"
        @scroll="handleBodyScroll"
      >
        <div
          ref="namesRow"
          class="vdocs:relative vdocs:flex vdocs:flex-row vdocs:gap-2"
        >
          <div :class="[FIELD_CLASSES, 'vdocs:min-w-0 vdocs:flex-1']">
            <label
              :for="firstNameFieldId"
              :class="LABEL_CLASSES"
            >
              First name
            </label>
            <input
              :id="firstNameFieldId"
              :name="firstNameFieldId"
              type="text"
              data-lpignore="true"
              :value="firstName"
              :class="[INPUT_CLASSES, 'vdocs:h-[34px]']"
              @focus="showSuggestions = true"
              @input="handleNameInput($event, 'first')"
            >
          </div>
          <div :class="[FIELD_CLASSES, 'vdocs:min-w-0 vdocs:flex-1']">
            <label
              :for="lastNameFieldId"
              :class="LABEL_CLASSES"
            >
              Last name
            </label>
            <input
              :id="lastNameFieldId"
              :name="lastNameFieldId"
              type="text"
              data-lpignore="true"
              :value="lastName"
              :class="[INPUT_CLASSES, 'vdocs:h-[34px]']"
              @focus="showSuggestions = true"
              @input="handleNameInput($event, 'last')"
            >
          </div>
        </div>

        <div :class="FIELD_CLASSES">
          <label
            :for="emailFieldId"
            :class="LABEL_CLASSES"
          >
            Email
          </label>
          <input
            :id="emailFieldId"
            v-model="email"
            :name="emailFieldId"
            type="text"
            data-lpignore="true"
            :class="[INPUT_CLASSES, 'vdocs:h-[34px]']"
            @focus="showSuggestions = false"
          >
        </div>

        <div
          v-if="hasSms"
          :class="FIELD_CLASSES"
        >
          <label
            :for="phoneFieldId"
            :class="LABEL_CLASSES"
          >
            Phone
            <span class="vdocs:font-normal vdocs:text-muted">(optional)</span>
          </label>
          <input
            :id="phoneFieldId"
            :name="phoneFieldId"
            type="text"
            data-lpignore="true"
            :value="phone"
            placeholder="+1 (555) 000-0000"
            :class="[INPUT_CLASSES, 'vdocs:h-[34px]']"
            @focus="showSuggestions = false"
            @input="handlePhoneInput"
          >
        </div>

        <div class="vdocs:mt-0.5 vdocs:mb-3">
          <div
            :id="verificationLabelId"
            :class="GROUP_LABEL_CLASSES"
          >
            Verification
          </div>
          <div
            role="group"
            :aria-labelledby="verificationLabelId"
            class="vdocs:flex vdocs:flex-row vdocs:flex-wrap vdocs:gap-1.5"
          >
            <button
              v-for="pill in verificationPills"
              :key="pill.value"
              type="button"
              :aria-pressed="pill.selected"
              :disabled="pill.locked && !pill.selected"
              :title="pill.locked ? 'Not included in your plan' : undefined"
              :class="pill.classes"
              @click="handleToggleAuthMethod(pill.value)"
            >
              <VerdocsLockClosedIcon
                v-if="pill.locked"
                class="vdocs:size-3 vdocs:shrink-0"
              />
              {{ pill.label }}
            </button>
          </div>

          <div
            v-if="authMethods.includes('passcode')"
            class="vdocs:mt-2 vdocs:flex vdocs:flex-row vdocs:items-center vdocs:gap-2"
          >
            <input
              v-model="passcode"
              type="text"
              aria-label="Passcode"
              data-lpignore="true"
              placeholder="4-8 digits"
              :class="[INPUT_CLASSES, 'vdocs:h-[30px] vdocs:w-[120px] vdocs:shrink-0']"
              @focus="showSuggestions = false"
            >
            <span class="vdocs:min-w-0 vdocs:flex-1 vdocs:self-center vdocs:text-[11px] vdocs:leading-[1.35] vdocs:text-muted">
              PIN or passcode already known by the recipient
            </span>
          </div>
        </div>

        <div class="vdocs:mt-0.5 vdocs:mb-3">
          <div
            :id="signingLabelId"
            :class="GROUP_LABEL_CLASSES"
          >
            Signing options
          </div>
          <div
            role="group"
            :aria-labelledby="signingLabelId"
            class="vdocs:flex vdocs:flex-row vdocs:flex-wrap vdocs:gap-1.5"
          >
            <button
              v-for="pill in signingPills"
              :key="pill.value"
              type="button"
              :aria-pressed="pill.selected"
              :class="pill.classes"
              @click="handleSetSigningOption(pill.value)"
            >
              {{ pill.label }}
            </button>
          </div>
        </div>

        <div :class="FIELD_CLASSES">
          <label
            :for="messageFieldId"
            :class="LABEL_CLASSES"
          >
            Message
            <span class="vdocs:font-normal vdocs:text-muted">(optional)</span>
          </label>
          <textarea
            :id="messageFieldId"
            v-model="message"
            :name="messageFieldId"
            data-lpignore="true"
            placeholder="Add a message to the invitation"
            :class="[INPUT_CLASSES, 'vdocs:h-14 vdocs:resize-y vdocs:py-2']"
            @focus="showSuggestions = false"
          />
        </div>
      </div>

      <div
        aria-hidden="true"
        class="vdocs:pointer-events-none vdocs:absolute vdocs:inset-x-0 vdocs:bottom-0 vdocs:h-9 vdocs:bg-linear-to-b vdocs:from-surface/0 vdocs:to-surface vdocs:opacity-0 vdocs:transition-opacity vdocs:duration-150 vdocs:group-[.vdocs-scroll-more]:opacity-100"
      />

      <div
        v-if="suggestionsOpen"
        ref="suggestionList"
        class="vdocs:absolute vdocs:inset-x-0 vdocs:z-20 vdocs:max-h-[225px] vdocs:overflow-y-auto vdocs:rounded-ctl vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:bg-surface vdocs:font-sans vdocs:shadow-[0_8px_24px_0_rgba(9,44,76,0.14)]"
      >
        <button
          v-for="suggestion in matchingSuggestions"
          :key="suggestion.id ?? suggestion.email"
          type="button"
          class="vdocs:flex vdocs:w-full vdocs:cursor-pointer vdocs:flex-row vdocs:items-center vdocs:border-none vdocs:bg-transparent vdocs:px-3 vdocs:py-1.5 vdocs:text-left vdocs:font-sans vdocs:hover:bg-accent-tint"
          @click="handleSelectSuggestion(suggestion)"
        >
          <img
            v-if="suggestion.picture"
            alt=""
            :src="suggestion.picture"
            class="vdocs:mr-2 vdocs:size-7 vdocs:shrink-0 vdocs:rounded-full"
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
            class="vdocs:mr-2 vdocs:size-7 vdocs:shrink-0 vdocs:text-muted"
          >
            <path d="M15 13a3 3 0 1 0-6 0" />
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />
            <circle
              cx="12"
              cy="8"
              r="2"
            />
          </svg>
          <span class="vdocs:flex vdocs:min-w-0 vdocs:flex-col">
            <span class="vdocs:text-[13px] vdocs:font-medium vdocs:text-ink">
              {{ formatFullName(suggestion) }}
            </span>
            <span
              v-if="suggestion.email"
              class="vdocs:truncate vdocs:text-xs vdocs:text-muted"
            >
              {{ suggestion.email }}
            </span>
            <span
              v-if="suggestion.phone"
              class="vdocs:truncate vdocs:text-xs vdocs:text-muted"
            >
              {{ suggestion.phone }}
            </span>
          </span>
        </button>
      </div>
    </div>

    <div class="vdocs:mt-2.5 vdocs:flex vdocs:shrink-0 vdocs:flex-row vdocs:gap-2.5 vdocs:border-0 vdocs:border-t vdocs:border-solid vdocs:border-edge-light vdocs:pt-3">
      <VerdocsButton
        v-if="showCancel"
        variant="text"
        label="Cancel"
        size="small"
        @click="handleCancel"
      />
      <VerdocsButton
        label="Done"
        size="small"
        :disabled="!canSubmit"
        class="vdocs:flex-1"
        @click="handleSubmit"
      />
    </div>
  </form>
</template>
