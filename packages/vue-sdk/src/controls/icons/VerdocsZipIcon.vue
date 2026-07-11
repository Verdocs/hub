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
      d="M10 16V22H14V16"
    />
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M6 16H18"
    />
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M20 22H4"
    />
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M12 10L12 16"
    />
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M8 12L12 16L16 12"
    />
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M4 16V4H20V16"
    />
  </svg>
</template>
