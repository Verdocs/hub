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
  xsmall: 'vdocs:h-6 vdocs:text-xs',
  small: 'vdocs:h-8 vdocs:text-[13px]',
  normal: 'vdocs:h-10 vdocs:text-sm',
  medium: 'vdocs:h-[46px] vdocs:text-[15px]',
  large: 'vdocs:h-[52px] vdocs:text-base',
};

// outline is the secondary/cancel role: a soft accent fill rather than a literal outline.
const VARIANT_CLASSES = {
  standard:
    'vdocs:bg-primary vdocs:text-white vdocs:border-none vdocs:rounded-ctl vdocs:shadow-xs vdocs:hover:bg-primary-dark vdocs:disabled:bg-disabled-fill vdocs:disabled:text-disabled vdocs:disabled:shadow-none',
  outline:
    'vdocs:bg-accent-tint vdocs:text-accent vdocs:border-none vdocs:rounded-ctl vdocs:hover:bg-accent-tint-dark vdocs:disabled:bg-disabled-fill vdocs:disabled:text-disabled',
  text: 'vdocs:bg-transparent vdocs:text-primary-dark vdocs:border-none vdocs:rounded-ctl vdocs:hover:bg-primary/10 vdocs:disabled:text-disabled',
};
</script>

<template>
  <button
    :type="type"
    :class="[
      'vdocs:font-sans vdocs:font-medium vdocs:whitespace-nowrap vdocs:cursor-pointer vdocs:inline-flex vdocs:items-center vdocs:justify-center vdocs:disabled:cursor-default vdocs:disabled:pointer-events-none',
      SIZE_CLASSES[size],
      VARIANT_CLASSES[variant],
    ]"
  >
    <span
      v-if="$slots['start-icon']"
      class="vdocs:ml-2.5 vdocs:-mr-1.5 vdocs:[&>svg]:size-4"
    >
      <slot name="start-icon" />
    </span>
    <span class="vdocs:px-3.5">
      {{ label }}
    </span>
    <span
      v-if="$slots['end-icon']"
      class="vdocs:mr-2.5 vdocs:-ml-1.5 vdocs:[&>svg]:size-4"
    >
      <slot name="end-icon" />
    </span>
  </button>
</template>
