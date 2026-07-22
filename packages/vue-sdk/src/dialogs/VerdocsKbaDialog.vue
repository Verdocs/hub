<script lang="ts">
import type { IKBAQuestion } from '@verdocs/js-sdk';

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
 * onAnswerQuestion, and onCancel callbacks are the submitIdentity, answerQuestion, and
 * cancel emits, with onAnswerQuestion's two arguments folded into the IKbaAnswer payload.
 */
export interface VerdocsKbaDialogProps {
  /** Which challenge to present: the identity details form, or the multiple-choice questions. */
  mode: 'identity' | 'questions';
  /** Heading for the help box shown above each question in questions mode. */
  helpTitle?: string;
  /** The questions to step through in questions mode, in the shape the KBA endpoints return. */
  questions?: IKBAQuestion[];
  /** Prefills the identity form, typically from the recipient record. */
  initialDetails?: Partial<IKbaIdentityDetails>;
}
</script>

<script setup lang="ts">
import { computed, ref } from 'vue';
import VerdocsSelectInput, { type ISelectOption } from '../controls/VerdocsSelectInput.vue';
import VerdocsTextInput from '../controls/VerdocsTextInput.vue';
import VerdocsCheckbox from '../controls/VerdocsCheckbox.vue';
import VerdocsDateInput from '../controls/VerdocsDateInput.vue';
import VerdocsButton from '../controls/VerdocsButton.vue';
import { VerdocsHelpCircleIcon } from '../controls/icons';
import VerdocsDialog from './VerdocsDialog.vue';

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

const { mode, helpTitle, questions = [], initialDetails } = defineProps<VerdocsKbaDialogProps>();

const emit = defineEmits<{
  /** Fired in identity mode when the signer submits the completed form. The sign embed wires this to the KBA identity endpoint. */
  submitIdentity: [details: IKbaIdentityDetails];
  /** Fired in questions mode as each question is answered, the last included. The sign embed accumulates these into the KBA challenge response. */
  answerQuestion: [answer: IKbaAnswer];
  /** Fired when the signer cancels via the Cancel button, the close control, or the overlay. */
  cancel: [];
}>();

// The prop only prefills the form; edits after mount belong to the signer.
const details = ref<IKbaIdentityDetails>({
  first_name: initialDetails?.first_name || '',
  last_name: initialDetails?.last_name || '',
  address: initialDetails?.address || '',
  city: initialDetails?.city || '',
  state: initialDetails?.state || '',
  zip: initialDetails?.zip || '',
  ssn_last_4: initialDetails?.ssn_last_4 || '',
  dob: initialDetails?.dob || '',
});
const agreed = ref(false);
const questionIndex = ref(0);
const choice = ref('');

const showStepCounter = computed(() => mode === 'questions' && questions.length > 1);
const question = computed(() => questions[questionIndex.value]);
const choiceOptions = computed(() => question.value?.answer || []);
const isLastQuestion = computed(() => questionIndex.value >= questions.length - 1);

const handleAnswer = () => {
  if (!question.value || !choice.value) {
    return;
  }

  emit('answerQuestion', { questionType: question.value.type, choice: choice.value });
  choice.value = '';
  if (!isLastQuestion.value) {
    questionIndex.value += 1;
  }
};

const choiceClasses = (option: string) => [
  'vdocs:flex vdocs:h-15 vdocs:cursor-pointer vdocs:items-center vdocs:justify-center vdocs:rounded-row vdocs:border vdocs:border-solid vdocs:border-accent-light vdocs:px-1 vdocs:font-sans vdocs:text-sm vdocs:text-center',
  choice.value === option ? 'vdocs:bg-accent-light vdocs:text-white' : 'vdocs:bg-transparent vdocs:text-muted',
];

const canSubmitIdentity = computed(() =>
  agreed.value
  && !!details.value.first_name
  && !!details.value.last_name
  && !!details.value.address
  && !!details.value.zip
  && !!details.value.ssn_last_4
  && !!details.value.dob);

// The identity provider needs an adult signer, so DOB entry keeps the legacy bounds of
// 1920 through 18 years ago.
const dobMax = (() => {
  const latest = new Date();
  latest.setFullYear(latest.getFullYear() - 18);
  return latest.toISOString().slice(0, 10);
})();

// The spread hands the caller a snapshot, not our live reactive object.
const handleSubmitIdentity = () => emit('submitIdentity', { ...details.value });
</script>

<template>
  <VerdocsDialog @close="emit('cancel')">
    <template #heading>
      Please Confirm Your Identity
      <span
        v-if="showStepCounter"
        class="vdocs:ml-1.5 vdocs:text-muted"
      >
        ({{ questionIndex + 1 }}/{{ questions.length }})
      </span>
    </template>

    <template v-if="mode === 'questions'">
      <div
        v-if="helpTitle || question"
        class="vdocs:flex vdocs:items-center vdocs:gap-4 vdocs:bg-accent-light vdocs:p-3.5 vdocs:text-white"
      >
        <VerdocsHelpCircleIcon class="vdocs:size-10 vdocs:shrink-0" />
        <div class="vdocs:text-sm">
          <div
            v-if="helpTitle"
            class="vdocs:font-semibold vdocs:mb-1"
          >
            {{ helpTitle }}
          </div>
          <div v-if="question">
            {{ question.prompt }}
          </div>
        </div>
      </div>

      <div class="vdocs:my-4 vdocs:grid vdocs:grid-cols-[repeat(auto-fill,minmax(100px,1fr))] vdocs:gap-4">
        <button
          v-for="option in choiceOptions"
          :key="option"
          type="button"
          :aria-pressed="choice === option"
          :class="choiceClasses(option)"
          @click="choice = option"
        >
          {{ option }}
        </button>
      </div>
    </template>

    <template v-else>
      <div class="vdocs:text-sm vdocs:font-medium vdocs:text-ink vdocs:mb-1">
        Your Name:
        <span class="vdocs:text-danger">*</span>
      </div>
      <div class="vdocs:grid vdocs:grid-cols-2 vdocs:gap-x-4">
        <VerdocsTextInput
          v-model="details.first_name"
          aria-label="First name"
          placeholder="First name..."
        />
        <VerdocsTextInput
          v-model="details.last_name"
          aria-label="Last name"
          placeholder="Last name..."
        />
      </div>

      <VerdocsTextInput
        v-model="details.address"
        label="Address"
        required
        placeholder="Address..."
      />

      <div class="vdocs:grid vdocs:grid-cols-3 vdocs:gap-x-4">
        <VerdocsTextInput
          v-model="details.city"
          label="City"
          placeholder="City..."
        />
        <VerdocsSelectInput
          v-model="details.state"
          label="State"
          :options="STATE_OPTIONS"
        />
        <VerdocsTextInput
          v-model="details.zip"
          label="Zip Code"
          required
          placeholder="Zip Code..."
        />
      </div>

      <div class="vdocs:grid vdocs:grid-cols-2 vdocs:gap-x-4">
        <VerdocsTextInput
          v-model="details.ssn_last_4"
          label="SSN Last 4"
          required
          placeholder="Last 4 digits of your Social Security Number..."
        />
        <VerdocsDateInput
          v-model="details.dob"
          label="Date of Birth"
          required
          min="1920-01-01"
          :max="dobMax"
        />
      </div>

      <VerdocsCheckbox
        v-model:checked="agreed"
        label="I agree to provide my personal information in order to validate my identity."
        class="vdocs:my-2 vdocs:italic"
      />
    </template>

    <template #footer>
      <div
        v-if="mode === 'questions'"
        class="vdocs:flex vdocs:justify-end vdocs:gap-4"
      >
        <VerdocsButton
          label="Cancel"
          variant="outline"
          @click="emit('cancel')"
        />
        <VerdocsButton
          :label="isLastQuestion ? 'Submit' : 'Next'"
          :disabled="!choice"
          @click="handleAnswer"
        />
      </div>
      <div
        v-else
        class="vdocs:flex vdocs:justify-end"
      >
        <VerdocsButton
          label="Submit"
          :disabled="!canSubmitIdentity"
          @click="handleSubmitIdentity"
        />
      </div>
    </template>
  </VerdocsDialog>
</template>
