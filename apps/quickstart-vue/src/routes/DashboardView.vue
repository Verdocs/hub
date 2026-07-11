<script setup lang="ts">
import { showToast, useSession, VerdocsButton, VerdocsTemplatesList, type ITemplateEvent, type SDKError } from '@verdocs/vue-sdk';
import { computed } from 'vue';

const { profile, endpoint } = useSession();

const userLabel = computed(() => (profile.value ? `${profile.value.first_name} ${profile.value.last_name} (${profile.value.email})` : ''));

// Clearing the session flips the route guard, which redirects to /login.
const handleSignOut = () => {
  endpoint.clearSession();
};

const onViewTemplate = ({ template }: ITemplateEvent) => showToast(`View template: ${template.name}`, { style: 'info' });
const onSubmittedData = ({ template }: ITemplateEvent) => showToast(`Submissions for: ${template.name}`, { style: 'info' });
const onEditTemplate = ({ template }: ITemplateEvent) => showToast(`Edit template: ${template.name}`, { style: 'info' });
const onSdkError = (error: SDKError) => showToast(error.message, { style: 'error' });
</script>

<template>
  <div>
    <header class="app-header">
      <h1>Verdocs Vue Quickstart</h1>
      <div class="user">
        {{ userLabel }}
      </div>
      <VerdocsButton
        label="Sign Out"
        size="small"
        variant="outline"
        @click="handleSignOut"
      />
    </header>

    <main class="app-main">
      <VerdocsTemplatesList
        @view-template="onViewTemplate"
        @submitted-data="onSubmittedData"
        @edit-template="onEditTemplate"
        @sdk-error="onSdkError"
      />
    </main>
  </div>
</template>
