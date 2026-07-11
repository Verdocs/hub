<script setup lang="ts">
import type { IconProps } from './types';

defineProps<IconProps>();
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    :aria-hidden="!title"
  >
    <title v-if="title">
      {{ title }}
    </title>
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M23 4V10H17"
    />
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M20.49 15A9 9 0 1 1 21.23 8"
    />
  </svg>
</template>
