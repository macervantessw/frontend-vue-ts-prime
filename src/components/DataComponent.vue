<script lang="ts" setup>
import { Icon } from "@iconify/vue";

defineProps({
  title: {
    type: String,
    required: true,
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
    default: "#d9e8e6",
  },
  iconText: {
    type: String,
    default: "",
  },
});
</script>

<template>
  <div>
    <div class="wrapper" :style="{ backgroundColor: color }">
      <div class="flex align-items-center">
        <Icon v-if="icon" :icon="icon" class="mr-2" />
        <div v-else-if="iconText" class="text-xs p-1 border-round bg-gray-700 text-white mr-2">{{ iconText }}</div>
        <span class="overflow-hidden white-space-nowrap">{{ title }} </span>
      </div>
      <span class="chip">{{ value ?? "-" }}</span>
    </div>
  </div>
</template>
<style></style>
