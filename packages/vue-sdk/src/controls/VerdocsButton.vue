<script lang="ts">
export interface VerdocsButtonProps {
  /** The label for the button. */
  label: string;
  /** The size (height) of the button. */
  size?: 'xsmall' | 'small' | 'normal' | 'medium' | 'large';
  /** The display variant of the button. */
  variant?: 'standard' | 'text' | 'outline';
  /** The native button type. Defaults to button so forms only submit via explicit submit buttons. */
  type?: 'button' | 'submit' | 'reset';
}
</script>

<script setup lang="ts">
const { label, size = 'normal', variant = 'standard', type = 'button' } = defineProps<VerdocsButtonProps>();

const SIZE_CLASSES = {
  xsmall: 'vdocs:h-[26px] vdocs:text-xs',
  small: 'vdocs:h-[34px] vdocs:text-[13px]',
  normal: 'vdocs:h-11 vdocs:text-sm',
  medium: 'vdocs:h-[52px] vdocs:text-base',
  large: 'vdocs:h-[60px] vdocs:text-xl',
};

const VARIANT_CLASSES = {
  standard:
    'vdocs:bg-primary vdocs:text-white vdocs:border-none vdocs:rounded-ctl vdocs:hover:bg-primary-dark vdocs:disabled:bg-disabled vdocs:disabled:text-white/70',
  outline:
    'vdocs:bg-transparent vdocs:text-primary-dark vdocs:border vdocs:border-solid vdocs:border-primary vdocs:rounded-ctl vdocs:hover:bg-primary/10 vdocs:disabled:text-disabled vdocs:disabled:border-disabled',
  text: 'vdocs:bg-transparent vdocs:text-primary-dark vdocs:border-none vdocs:rounded-ctl vdocs:hover:bg-primary/10 vdocs:disabled:text-disabled',
};
</script>

<template>
  <button
    :type="type"
    :class="[
      'vdocs:font-sans vdocs:font-medium vdocs:cursor-pointer vdocs:inline-flex vdocs:items-center vdocs:justify-center vdocs:disabled:cursor-default vdocs:disabled:pointer-events-none',
      SIZE_CLASSES[size],
      VARIANT_CLASSES[variant],
    ]"
  >
    <span
      v-if="$slots['start-icon']"
      class="vdocs:mx-1 vdocs:[&>svg]:size-5"
    >
      <slot name="start-icon" />
    </span>
    <span class="vdocs:px-2.5">
      {{ label }}
    </span>
    <span
      v-if="$slots['end-icon']"
      class="vdocs:mx-1 vdocs:[&>svg]:size-5"
    >
      <slot name="end-icon" />
    </span>
  </button>
</template>
