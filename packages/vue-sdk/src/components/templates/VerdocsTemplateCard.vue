<script lang="ts">
import type { ITemplate } from '@verdocs/js-sdk';

export interface VerdocsTemplateCardProps {
  /** The template to summarize. */
  template: ITemplate;
}
</script>

<script setup lang="ts">
import { VerdocsEnvelopeIcon, VerdocsFileCheckIcon } from '../../controls/icons';
import VerdocsStarOutlineIcon from '../../controls/icons/VerdocsStarOutlineIcon.vue';

const { template } = defineProps<VerdocsTemplateCardProps>();

const emit = defineEmits<{
  /**
   * Fired when the user clicks the card (the React card's onClick). React only
   * showed the pointer cursor when an onClick was supplied; the Vue card is
   * always clickable and the parent simply ignores the event if unhandled.
   */
  select: [template: ITemplate];
}>();
</script>

<template>
  <div
    class="vdocs:flex vdocs:flex-col vdocs:w-[320px] vdocs:h-[320px] vdocs:p-[25px] vdocs:box-border vdocs:bg-surface vdocs:font-sans vdocs:text-ink vdocs:shadow-[2px_2px_5px_rgba(51,54,75,0.05)] vdocs:cursor-pointer"
    @click="emit('select', template)"
  >
    <span class="vdocs:text-lg vdocs:font-bold vdocs:mb-[7px]">
      {{ template.name }}
    </span>

    <span class="vdocs:text-sm vdocs:font-bold vdocs:mb-1.5">
      {{ template.organization?.name || 'Public' }}
    </span>

    <hr class="vdocs:w-full vdocs:h-px vdocs:mb-[17px] vdocs:bg-edge vdocs:border-none">

    <div class="vdocs:flex vdocs:flex-row vdocs:justify-between vdocs:text-base">
      <div class="vdocs:flex vdocs:flex-1 vdocs:items-center vdocs:gap-2 vdocs:mr-2 vdocs:border-r vdocs:border-solid vdocs:border-edge">
        <VerdocsStarOutlineIcon
          title="Stars"
          class="vdocs:size-4 vdocs:shrink-0 vdocs:text-edge"
        />
        <span>
          {{ template.star_counter }}
        </span>
      </div>

      <div class="vdocs:flex vdocs:flex-1 vdocs:items-center vdocs:justify-center vdocs:gap-2 vdocs:mr-2 vdocs:border-r vdocs:border-solid vdocs:border-edge">
        <VerdocsFileCheckIcon
          title="Pages"
          class="vdocs:size-4 vdocs:shrink-0 vdocs:text-edge"
        />
        <span>
          {{ template.documents?.[0]?.pages || 1 }}
        </span>
      </div>

      <div class="vdocs:flex vdocs:flex-1 vdocs:items-center vdocs:justify-center vdocs:gap-2">
        <VerdocsEnvelopeIcon
          title="Usage Counter"
          class="vdocs:size-4 vdocs:shrink-0 vdocs:text-edge"
        />
        <span>
          {{ template.counter }}
        </span>
      </div>
    </div>
  </div>
</template>
