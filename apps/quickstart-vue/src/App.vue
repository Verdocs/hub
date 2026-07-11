<script setup lang="ts">
import { VerdocsProvider } from '@verdocs/vue-sdk';

const apiBase = import.meta.env.VITE_VERDOCS_API_BASE || 'https://stage-api.verdocs.com';
</script>

<template>
  <VerdocsProvider :base-url="apiBase">
    <RouterView />
  </VerdocsProvider>
</template>
