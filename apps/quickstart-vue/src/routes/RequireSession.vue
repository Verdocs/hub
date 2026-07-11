<script setup lang="ts">
import { useSession, VerdocsSpinner } from '@verdocs/vue-sdk';
import { useRouter } from 'vue-router';
import { watchEffect } from 'vue';

const router = useRouter();
const { loaded, authenticated } = useSession();

// Simple auth guard: wait for the initial session check, then either render
// the protected child route or bounce to the login view.
watchEffect(() => {
  if (loaded.value && !authenticated.value) {
    void router.replace('/login');
  }
});
</script>

<template>
  <div
    v-if="!loaded"
    class="loading-wrap"
  >
    <VerdocsSpinner mode="dark" />
  </div>
  <RouterView v-else-if="authenticated" />
</template>
