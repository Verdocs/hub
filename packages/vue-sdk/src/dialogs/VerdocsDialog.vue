<script lang="ts">
/**
 * The base modal dialog: a centered panel over a dimmed overlay, teleported to
 * document.body so it escapes any overflow or stacking context set by its
 * parents. The other dialogs compose this and supply heading, body, and footer
 * content. Dismissal is the caller's job: render it conditionally and clear
 * your own state from the close event (React's onClose callback).
 *
 * React's ReactNode heading and footer props map to named slots here, the
 * Vue-native form of node-valued props. Plain string headings can use the
 * heading prop instead; the heading slot wins when both are supplied. The
 * header row and footer padding only render when content was actually given,
 * matching the React component's "prop is undefined" semantics.
 *
 * ```vue
 * <VerdocsDialog v-if="open" heading="Are you sure?" @close="open = false">
 *   Body content
 *   <template #footer>
 *     <VerdocsButton label="OK" @click="confirm" />
 *   </template>
 * </VerdocsDialog>
 * ```
 */
export interface VerdocsDialogProps {
  /** Rendered in the header row with the title treatment. The heading slot replaces it for rich content. */
  heading?: string;
  /** If true, clicking the background overlay will not close the dialog. */
  persistent?: boolean;
}
</script>

<script setup lang="ts">
import { VerdocsClearIcon } from '../controls/icons';

const { heading, persistent = false } = defineProps<VerdocsDialogProps>();

const emit = defineEmits<{
  /** Fired when the user dismisses via the overlay or the close button. React's onClose. */
  close: [];
}>();

const handleOverlayClick = (event: MouseEvent) => {
  // Only a direct overlay click dismisses; clicks inside the panel land on
  // descendants and stay put.
  if (!persistent && event.target === event.currentTarget) {
    event.preventDefault();
    emit('close');
  }
};
</script>

<template>
  <Teleport to="body">
    <div
      class="vdocs:fixed vdocs:inset-0 vdocs:z-[10000] vdocs:flex vdocs:items-center vdocs:justify-center vdocs:bg-ink/40 vdocs:font-sans vdocs:box-border"
      @click="handleOverlayClick"
    >
      <div
        role="dialog"
        aria-modal="true"
        class="vdocs:relative vdocs:flex vdocs:w-[520px] vdocs:max-w-[95%] vdocs:flex-col vdocs:overflow-hidden vdocs:rounded-lg vdocs:bg-surface vdocs:shadow-lg"
      >
        <button
          type="button"
          aria-label="Close"
          class="vdocs:absolute vdocs:top-4 vdocs:right-4 vdocs:z-20 vdocs:flex vdocs:size-6 vdocs:cursor-pointer vdocs:items-center vdocs:justify-center vdocs:border-none vdocs:bg-transparent vdocs:p-0 vdocs:text-edge vdocs:transition-colors vdocs:hover:text-muted"
          @click="emit('close')"
        >
          <VerdocsClearIcon class="vdocs:size-5" />
        </button>

        <div
          v-if="heading !== undefined || $slots.heading"
          class="vdocs:flex vdocs:items-center vdocs:justify-between vdocs:border-b vdocs:border-solid vdocs:border-edge-light vdocs:px-6 vdocs:py-4"
        >
          <div class="vdocs:text-2xl vdocs:font-medium vdocs:text-ink vdocs:leading-8">
            <slot name="heading">
              {{ heading }}
            </slot>
          </div>
        </div>

        <div class="vdocs:p-6 vdocs:text-sm vdocs:text-ink">
          <slot />
        </div>

        <div
          v-if="$slots.footer"
          class="vdocs:px-6 vdocs:pb-6"
        >
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>
