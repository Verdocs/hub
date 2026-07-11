<script lang="ts">
export interface VerdocsComponentErrorProps {
  /** The message to display. */
  message: string;
}
</script>

<script setup lang="ts">
defineProps<VerdocsComponentErrorProps>();
</script>

<template>
  <div
    role="alert"
    class="vdocs:font-sans vdocs:flex vdocs:p-[15px] vdocs:items-center vdocs:justify-center"
  >
    <div class="vdocs:flex-1 vdocs:h-[300px] vdocs:flex vdocs:text-lg vdocs:text-ink vdocs:box-border vdocs:px-5 vdocs:bg-surface vdocs:items-center vdocs:justify-center">
      {{ message }}
    </div>
  </div>
</template>
