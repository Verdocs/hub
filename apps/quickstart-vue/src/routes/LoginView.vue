<script setup lang="ts">
import { useSession, VerdocsAuth, type SDKError } from '@verdocs/vue-sdk';
import { useRouter } from 'vue-router';
import { watchEffect } from 'vue';

const router = useRouter();
const { loaded, authenticated } = useSession();

// Session state drives routing: when VerdocsAuth completes a login, the
// session change reruns this watcher and the redirect fires.
watchEffect(() => {
  if (loaded.value && authenticated.value) {
    void router.replace('/dashboard');
  }
});

const logSdkError = (error: SDKError) => console.warn('SDK error', error);
</script>

<template>
  <div class="login-wrap">
    <VerdocsAuth @sdk-error="logSdkError" />
  </div>
</template>
