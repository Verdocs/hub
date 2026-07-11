<script lang="ts">
import type { IEnvelopeField } from '@verdocs/js-sdk';

/** Which stage of the signing flow the card reflects. */
export type TSigningProgressMode = 'start' | 'signing' | 'completed';

/**
 * The floating progress card shown alongside the signing experience: remaining
 * field counts, the focused field's label, and the flow controls (Start
 * Signing, Previous/Next, Submit). Progress is derived entirely from the field
 * props; the card keeps no state and runs no timers, so the caller advances
 * the flow in response to the events. React's onStart/onNext/onPrevious/
 * onSubmit callbacks are the start, next, previous, and submit emits.
 *
 * The legacy card pins itself above the document viewer and disappears on
 * small screens; callers can override the placement with a class of their own,
 * which merges onto the wrapper via attribute fallthrough (React's className).
 */
export interface VerdocsSigningProgressProps {
  /** The stage to render: the pre-signing prompt, in-flight progress, or the ready-to-submit card. */
  mode?: TSigningProgressMode;
  /** The fillable fields for the current recipient, in signing order. */
  fields?: IEnvelopeField[];
  /** Every field for the recipient, including auto-filled ones. Grouped radio checks need the full set; defaults to fields. */
  recipientFields?: IEnvelopeField[];
  /** The name of the currently focused field, used to show its label and position. */
  focusedField?: string;
}
</script>

<script setup lang="ts">
import { computed } from 'vue';
import { isFieldFilled } from '@verdocs/js-sdk';
import VerdocsButton from '../controls/VerdocsButton.vue';
import { VerdocsCircleCheckIcon } from '../controls/icons';

const FIELD_TYPE_LABELS: Record<string, string> = {
  signature: 'Signature',
  initial: 'Initials',
  date: 'Date',
  textbox: 'Text Field',
  checkbox: 'Checkbox',
  radio: 'Radio Button',
  dropdown: 'Dropdown',
  attachment: 'Attachment',
  payment: 'Payment',
};

const fieldLabel = (field?: IEnvelopeField) => {
  if (!field) {
    return '';
  }

  const typeName = FIELD_TYPE_LABELS[field.type] || 'Field';
  return field.required ? `Required ${typeName}*` : `Optional ${typeName}`;
};

const CARD_CLASSES =
  'vdocs:box-border vdocs:flex vdocs:w-60 vdocs:flex-col vdocs:gap-3 vdocs:rounded-lg vdocs:bg-surface vdocs:p-4 vdocs:shadow-lg vdocs:font-sans';

const { mode = 'start', fields = [], recipientFields, focusedField = '' } = defineProps<VerdocsSigningProgressProps>();

const emit = defineEmits<{
  /** Fired when the user clicks Start Signing. */
  start: [];
  /** Fired when the user clicks Next. */
  next: [];
  /** Fired when the user clicks Previous. */
  previous: [];
  /** Fired when the user clicks Submit. */
  submit: [];
}>();

// Destructure defaults cannot reference sibling props, so the fields fallback
// lands here instead.
const effectiveRecipientFields = computed(() => recipientFields ?? fields);

// js-sdk counts a grouped radio as filled when any member of its group is
// selected. The legacy card layered stricter own-value checks on top for
// dropdowns, radios, and checkboxes, and we keep its exact predicate.
const isFilled = (field: IEnvelopeField) =>
  isFieldFilled(field, effectiveRecipientFields.value)
  && (field.type !== 'dropdown' || !!field.value)
  && (field.type !== 'radio' || field.value === 'true')
  && (field.type !== 'checkbox' || field.value === 'true');

const requiredFields = computed(() => fields.filter(field => field.required));
const requiredRemaining = computed(() => requiredFields.value.filter(field => !isFilled(field)).length);
const optionalFields = computed(() => fields.filter(field => !field.required));
const optionalRemaining = computed(() => optionalFields.value.filter(field => !isFilled(field)).length);

const focusedFieldObj = computed(() => fields.find(field => field.name === focusedField));
const focusedLabel = computed(() => fieldLabel(focusedFieldObj.value));
const currentIndex = computed(() => Math.max(1, fields.findIndex(field => field.name === focusedField) + 1));
const readyToSubmit = computed(() => requiredRemaining.value === 0);
const focusedDone = computed(() => (focusedFieldObj.value ? isFilled(focusedFieldObj.value) : false));
const showReadyBody = computed(() => mode !== 'start' && focusedDone.value && readyToSubmit.value);
</script>

<template>
  <div class="vdocs:fixed vdocs:top-16 vdocs:left-5 vdocs:z-[900] vdocs:max-[600px]:hidden">
    <div
      v-if="mode === 'completed'"
      :class="CARD_CLASSES"
    >
      <div class="vdocs:flex vdocs:items-center vdocs:gap-2 vdocs:text-sm vdocs:font-medium vdocs:text-ink">
        <VerdocsCircleCheckIcon class="vdocs:size-6 vdocs:shrink-0 vdocs:text-success" />
        Ready to Submit
      </div>
      <div class="vdocs:text-xs vdocs:leading-4 vdocs:text-muted">
        You have entered all requested signatures. Select Submit to complete the signing process.
      </div>
      <div class="vdocs:h-px vdocs:w-full vdocs:bg-edge-light" />
      <VerdocsButton
        label="Submit"
        size="small"
        class="vdocs:w-full"
        @click="emit('submit')"
      />
    </div>

    <div
      v-else
      :class="CARD_CLASSES"
    >
      <div class="vdocs:flex vdocs:flex-col vdocs:gap-1.5 vdocs:text-sm vdocs:text-ink">
        <div>
          {{ requiredRemaining }} of {{ requiredFields.length }} required fields remaining
        </div>
        <div
          v-if="optionalFields.length > 0"
          class="vdocs:text-muted"
        >
          {{ optionalRemaining }} of {{ optionalFields.length }} optional fields remaining
        </div>
      </div>

      <div
        v-if="showReadyBody"
        class="vdocs:flex vdocs:items-center vdocs:gap-2 vdocs:text-xs vdocs:leading-4 vdocs:text-ink"
      >
        <VerdocsCircleCheckIcon class="vdocs:size-6 vdocs:shrink-0 vdocs:text-success" />
        Ready to submit.
      </div>
      <div
        v-else
        class="vdocs:text-xs vdocs:leading-4 vdocs:text-ink"
      >
        {{ focusedLabel }}
      </div>

      <div class="vdocs:h-px vdocs:w-full vdocs:bg-edge-light" />

      <VerdocsButton
        v-if="mode === 'start'"
        label="Start Signing"
        size="small"
        class="vdocs:w-full"
        @click="emit('start')"
      />
      <VerdocsButton
        v-else-if="readyToSubmit"
        label="Submit"
        size="small"
        class="vdocs:w-full"
        @click="emit('submit')"
      />
      <div
        v-else
        class="vdocs:flex vdocs:w-full vdocs:gap-3"
      >
        <VerdocsButton
          label="Previous"
          size="small"
          variant="outline"
          class="vdocs:flex-1"
          :disabled="currentIndex <= 1"
          @click="emit('previous')"
        />
        <VerdocsButton
          label="Next"
          size="small"
          class="vdocs:flex-1"
          :disabled="currentIndex >= fields.length"
          @click="emit('next')"
        />
      </div>
    </div>
  </div>
</template>
