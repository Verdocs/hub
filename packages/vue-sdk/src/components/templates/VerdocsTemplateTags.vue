<script lang="ts">
export interface VerdocsTemplateTagsProps {
  /** The tags to display. */
  tags?: string[];
}
</script>

<script setup lang="ts">
const { tags = [] } = defineProps<VerdocsTemplateTagsProps>();
</script>

<template>
  <div class="vdocs:font-sans">
    <!-- Display-only, mirroring the React TemplateTags: tags are assigned to
         templates through the API, not edited here. Host classes fall through
         to this root the way className lands on the React div. -->
    <span
      v-for="tag in tags"
      :key="tag"
      class="vdocs:inline-block vdocs:box-border vdocs:h-7 vdocs:mx-1 vdocs:px-3 vdocs:pt-[5px] vdocs:pb-[7px] vdocs:text-xs vdocs:font-semibold vdocs:uppercase vdocs:rounded-row vdocs:text-ink vdocs:bg-canvas vdocs:border vdocs:border-solid vdocs:border-accent-light"
    >
      {{ tag }}
    </span>
  </div>
</template>
