<script lang="ts">
import type { FieldBaseProps } from './types';

/**
 * Displays an initials field. Unsigned, it renders the "Initial" affordance and
 * reports clicks through beginSigning (the React field's onBeginSigning callback)
 * so the caller can run the adopt-initials dialog. Once initialed (initialUrl set)
 * or done, the adopted image is drawn sized to the field box.
 *
 * The legacy component fetched the initials blob by ID itself. Here the caller
 * resolves the image and passes a URL; the sign embed will own that lookup, along
 * with the legacy Edit/Clear menu on a completed field. Builder-only affordances
 * (drag, resize, the settings popover) are omitted per docs/PORTING.md.
 */
export interface VerdocsFieldInitialProps extends FieldBaseProps {
  /** Resolved URL for the adopted initials image (a data:, blob:, or https: URL). */
  initialUrl?: string;
}
</script>

<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';
import { signerClassName } from './types';

const { field, initialUrl, disabled = false, done = false, focused = false, signerIndex = 0 } = defineProps<VerdocsFieldInitialProps>();

const emit = defineEmits<{
  /** Fired when the user clicks the unsigned field to start the adopt-initials flow (the React field's onBeginSigning). */
  beginSigning: [];
}>();

const BOX_CLASSES =
  'vdocs:font-sans vdocs:relative vdocs:box-border vdocs:block vdocs:w-[83px] vdocs:h-9 vdocs:text-[11px] vdocs:tracking-[0.3px] vdocs:scroll-my-5';

const IMAGE_CLASSES = 'vdocs:block vdocs:h-full vdocs:w-auto vdocs:max-w-none';

const buttonEl = ref<HTMLButtonElement | null>(null);

// The legacy focusField() imperative method becomes the focused prop: when the
// parent flips it on, move real keyboard focus onto the affordance. Post flush
// so the element exists by the time the first run fires.
watchEffect(() => {
  if (focused) {
    buttonEl.value?.focus();
  }
}, { flush: 'post' });

const filled = computed(() => !!initialUrl);
const required = computed(() => !!field.required);

const handleBegin = () => {
  emit('beginSigning');
};

const wrapperClasses = computed(() => {
  if (done) {
    return `vdocs-field vdocs-done ${BOX_CLASSES}`;
  }

  return [
    'vdocs-field',
    required.value && 'vdocs-required',
    disabled && 'vdocs-disabled',
    focused && 'vdocs-focused',
    filled.value && 'vdocs-filled',
    signerClassName(signerIndex),
    BOX_CLASSES,
    'vdocs:cursor-pointer',
    // Filled fields drop their border and background so only the image shows. The signer
    // class stays on the element as a white-label hook; bg-transparent outranks it because
    // the utilities layer comes after components, standing in for the legacy .filled !important.
    filled.value
      ? 'vdocs:bg-transparent'
      : `vdocs:border vdocs:border-solid ${required.value ? 'vdocs:border-danger' : 'vdocs:border-[rgba(0,0,0,0.2)]'}`,
  ];
});
</script>

<template>
  <div :class="wrapperClasses">
    <template v-if="done">
      <img
        v-if="initialUrl"
        :class="IMAGE_CLASSES"
        :src="initialUrl"
        alt="Initial"
      >
    </template>

    <template v-else>
      <!-- The legacy chip was a bare <label>; a span avoids implying a form association
           that does not exist. -->
      <span
        v-if="field.label"
        class="vdocs:absolute vdocs:-top-3.5 vdocs:-left-px vdocs:h-3.5 vdocs:px-1 vdocs:text-[9px] vdocs:leading-[13px] vdocs:text-white vdocs:bg-[#4a4a99] vdocs:rounded-t-[2px]"
      >
        {{ field.label }}
      </span>

      <div
        v-if="filled"
        :class="[ 'vdocs:relative vdocs:size-full', disabled ? 'vdocs:opacity-50 vdocs:pointer-events-none' : '' ]"
      >
        <img
          :class="IMAGE_CLASSES"
          :src="initialUrl"
          alt="Initial"
        >
      </div>

      <button
        v-else
        ref="buttonEl"
        type="button"
        :disabled="disabled"
        class="vdocs:box-border vdocs:size-full vdocs:p-0 vdocs:bg-transparent vdocs:border-none vdocs:font-sans vdocs:font-medium vdocs:text-[11px] vdocs:text-[rgba(0,0,0,0.87)] vdocs:cursor-pointer vdocs:disabled:cursor-default"
        @click="handleBegin"
      >
        Initial
      </button>
    </template>
  </div>
</template>
