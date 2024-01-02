<script lang="ts" setup>
import { Icon } from "@iconify/vue";

defineProps({
  title: {
    type: String,
    rquired: true,
  },
  value: {
    type: [String, Number],
    default: undefined,
  },
  icon: {
    type: String,
    default: "",
  },
  color: {
    type: String,
    default: () => `hsl(${Math.floor(Math.random() * 360) + 1}, 70%, 90%)`,
  },
  iconText: {
    type: String,
    default: "",
  },
});
</script>

<template>
  <div class="wrapper" :style="{ backgroundColor: color }">
    <div class="flex align-items-center">
      <Icon v-if="icon" :icon="icon" class="mr-2" />
      <div v-else-if="iconText" class="text-xs p-1 border-round border-1 bg-gray-700 text-white mr-2">{{ iconText }}</div>
      <span>{{ title }} </span>
    </div>
    <span class="chip">{{ value ?? "-" }}</span>
  </div>
</template>
<style></style>
