<script setup lang="ts">
import type { IconProps } from './types';

defineProps<IconProps>();
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    :aria-hidden="!title"
  >
    <title v-if="title">
      {{ title }}
    </title>
    <path d="M7 10l5 5 5-5H7z" />
  </svg>
</template>
