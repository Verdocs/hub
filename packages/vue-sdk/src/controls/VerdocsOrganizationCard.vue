<script lang="ts">
import type { IOrganization } from '@verdocs/js-sdk';

export interface VerdocsOrganizationCardProps {
  /** The organization to display. */
  organization: IOrganization;
}
</script>

<script setup lang="ts">
import { VerdocsBuildingOfficeIcon } from './icons';

defineProps<VerdocsOrganizationCardProps>();
</script>

<template>
  <div class="vdocs:flex vdocs:flex-row vdocs:items-center vdocs:gap-3.5 vdocs:px-[15px] vdocs:py-[7px] vdocs:bg-surface vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:rounded-lg vdocs:font-sans vdocs:text-ink">
    <img
      v-if="organization.thumbnail_url"
      :src="organization.thumbnail_url"
      alt="Logo"
      class="vdocs:size-6 vdocs:shrink-0"
    >
    <VerdocsBuildingOfficeIcon
      v-else
      class="vdocs:size-6 vdocs:shrink-0 vdocs:text-edge"
    />

    <div class="vdocs:flex vdocs:flex-col vdocs:overflow-hidden">
      <div class="vdocs:text-base vdocs:whitespace-nowrap vdocs:text-ellipsis vdocs:overflow-hidden">
        {{ organization.name }}
      </div>

      <a
        v-if="organization.url"
        :href="organization.url"
        target="_blank"
        rel="noreferrer nofollow"
        class="vdocs:text-sm vdocs:text-accent vdocs:no-underline vdocs:hover:underline vdocs:whitespace-nowrap vdocs:text-ellipsis vdocs:overflow-hidden"
      >
        {{ organization.url }}
      </a>
    </div>
  </div>
</template>
