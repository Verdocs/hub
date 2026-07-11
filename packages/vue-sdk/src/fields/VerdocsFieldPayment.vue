<script lang="ts">
import type { FieldBaseProps } from './types';

/**
 * Displays a payment field. Unpaid, it renders a dollar-sign affordance and reports
 * clicks through beginPayment (the React field's onBeginPayment callback) so the
 * caller can run the payment flow; paid or done, it renders a dollar-and-check
 * "collected" treatment.
 *
 * This is a representative display port. The legacy component carried vestigial
 * payment plumbing with no provider integration: recipient lists feeding a
 * prepared-by message that never rendered, and a stamp image that was never
 * populated. Collecting a payment belongs to the sign embed era, so none of that
 * is ported. Builder-only affordances (drag, resize, the settings popover) are
 * omitted per docs/PORTING.md.
 */
export interface VerdocsFieldPaymentProps extends FieldBaseProps {
  /** Render the payment-collected treatment instead of the payment affordance. */
  paid?: boolean;
}
</script>

<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';
import { VerdocsCheckIcon } from '../controls/icons';
import { signerClassName } from './types';

const { field, paid = false, disabled = false, done = false, focused = false, signerIndex = 0 } = defineProps<VerdocsFieldPaymentProps>();

const emit = defineEmits<{
  /** Fired when the user clicks the unpaid field to start the payment flow (the React field's onBeginPayment). */
  beginPayment: [];
}>();

const BOX_CLASSES =
  'vdocs:font-sans vdocs:relative vdocs:box-border vdocs:block vdocs:size-6 vdocs:text-[11px] vdocs:scroll-my-5 vdocs:border vdocs:border-solid vdocs:border-[#ccffaa]';

const buttonEl = ref<HTMLButtonElement | null>(null);

// The legacy focusField() imperative method becomes the focused prop: when the
// parent flips it on, move real keyboard focus onto the affordance. Post flush
// so the element exists by the time the first run fires.
watchEffect(() => {
  if (focused) {
    buttonEl.value?.focus();
  }
}, { flush: 'post' });

const handleBegin = () => {
  emit('beginPayment');
};

const wrapperClasses = computed(() => {
  if (done) {
    return `vdocs-field vdocs-done ${BOX_CLASSES}`;
  }

  return [
    'vdocs-field',
    !!field.required && 'vdocs-required',
    disabled && 'vdocs-disabled',
    focused && 'vdocs-focused',
    paid && 'vdocs-filled',
    signerClassName(signerIndex),
    BOX_CLASSES,
    'vdocs:cursor-pointer',
    disabled && 'vdocs:opacity-50',
  ];
});
</script>

<template>
  <div :class="wrapperClasses">
    <!-- The legacy component drew "$" plus a check character once payment was collected.
         We keep the treatment but draw the check as an icon so the glyph scales with
         the box. -->
    <span
      v-if="done || paid"
      role="img"
      aria-label="Paid"
      class="vdocs:flex vdocs:size-full vdocs:items-center vdocs:justify-center vdocs:gap-px vdocs:font-medium vdocs:text-[rgba(0,0,0,0.87)]"
    >
      $
      <VerdocsCheckIcon class="vdocs:size-3" />
    </span>

    <button
      v-else
      ref="buttonEl"
      type="button"
      aria-label="Payment"
      :disabled="disabled"
      class="vdocs:box-border vdocs:size-full vdocs:p-0 vdocs:bg-transparent vdocs:border-none vdocs:font-sans vdocs:font-medium vdocs:text-[11px] vdocs:text-[rgba(0,0,0,0.87)] vdocs:cursor-pointer vdocs:disabled:cursor-default"
      @click="handleBegin"
    >
      $
    </button>
  </div>
</template>
