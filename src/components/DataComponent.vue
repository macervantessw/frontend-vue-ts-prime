<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import { ref } from "vue";

const props = defineProps({
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
  numDecimals: {
    type: Number,
    default: 0,
  },
  units: {
    type: String,
    default: "",
  },
  tooltip: {
    type: [String, Boolean],
    default: false,
  },
});

const focusable = ref<HTMLElement | null>(null);

const getValue = () => {
  if (props.value === undefined) return "-";
  if (isNaN(Number(props.value))) return props.value;
  return Number(props.value).toFixed(props.numDecimals);
};

const getFocus = () => {
  focusable.value?.focus();
};
</script>

<template>
  <div v-tooltip.top="tooltip">
    <div class="wrapper" :style="{ backgroundColor: color }">
      <div class="flex align-items-center">
        <Icon v-if="icon" :icon="icon" class="mr-2" />
        <div v-else-if="iconText" class="text-xs p-1 border-round bg-gray-700 text-white mr-2 flex justify-content-center" style="min-width: 17px">{{ iconText }}</div>
        <span class="overflow-hidden white-space-nowrap">{{ title }} </span>
        <div
          v-if="tooltip"
          ref="focusable"
          v-tooltip.focus="tooltip"
          class="touch-tooltip hidden align-items-start"
          tabindex="0"
          style="padding: 2px 5px"
          @click="getFocus()"
        >
          <i class="pi pi-info-circle text-xs opacity-70" />
        </div>
      </div>
      <span class="chip">{{ getValue() }} {{ units }}</span>
    </div>
  </div>
</template>
<style>
@media (hover: none) {
  .touch-tooltip {
    display: flex !important;
  }
}
</style>
