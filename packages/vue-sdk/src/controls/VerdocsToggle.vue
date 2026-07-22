<script lang="ts">
/**
 * A group of icon buttons where exactly one is selected at a time, with an
 * optional heading label.
 *
 * Mirrors the React SDK Toggle. React's controlled selection prop, uncontrolled
 * defaultSelection, and onChange callback collapse into the selection model
 * (v-model:selection, defaulting to 0 when unbound) plus the buttonSelected
 * emit, which carries the same (button, index) payload onChange did. React's
 * per-button icon node becomes the icon scoped slot, which receives the button
 * and its index. Icons render at 30px and inherit the current text color.
 */
export interface IToggleButton {
  /** Identifier for the button, reported to buttonSelected. */
  id: string;
  /** Accessible name for the button. */
  label: string;
}

export interface VerdocsToggleProps {
  /** Optional heading label displayed before the buttons. Also names the group for assistive tech. */
  label?: string;
  /** The buttons to display. */
  buttons: IToggleButton[];
}
</script>

<script setup lang="ts">
const { label, buttons } = defineProps<VerdocsToggleProps>();

const emit = defineEmits<{
  /** Fired when the user selects a button. */
  buttonSelected: [button: IToggleButton, index: number];
}>();

/** Index of the selected button. */
const selection = defineModel<number>('selection', { default: 0 });

const buttonClasses = (selected: boolean) => [
  'vdocs:flex vdocs:items-center vdocs:justify-center vdocs:size-[60px] vdocs:p-0 vdocs:border-2 vdocs:border-solid vdocs:border-accent vdocs:rounded-row vdocs:cursor-pointer vdocs:transition-colors vdocs:duration-200 vdocs:[&_svg]:size-[30px] vdocs:hover:bg-accent vdocs:hover:text-canvas',
  selected ? 'vdocs:bg-accent-light vdocs:text-white' : 'vdocs:bg-surface vdocs:text-ink',
];

const handleSelect = (button: IToggleButton, index: number) => {
  selection.value = index;
  emit('buttonSelected', button, index);
};
</script>

<template>
  <div
    role="group"
    :aria-label="label"
    class="vdocs:flex vdocs:items-center vdocs:bg-canvas vdocs:font-sans"
  >
    <span
      v-if="label"
      class="vdocs:text-2xl vdocs:font-bold vdocs:text-ink vdocs:mr-7"
    >
      {{ label }}:
    </span>
    <div class="vdocs:flex vdocs:gap-[11px]">
      <button
        v-for="(button, index) in buttons"
        :key="button.id"
        type="button"
        :aria-label="button.label"
        :aria-pressed="index === selection"
        :class="buttonClasses(index === selection)"
        @click="handleSelect(button, index)"
      >
        <slot
          name="icon"
          :button="button"
          :index="index"
        />
      </button>
    </div>
  </div>
</template>
