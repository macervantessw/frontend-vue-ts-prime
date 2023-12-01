<script setup lang="ts">
import { useMainStore } from "../store";
import { storeToRefs } from "pinia";
import { useWindowSize } from "@vueuse/core";
import { computed } from "vue";

const { width } = useWindowSize();

const mainStore = useMainStore();
const { menuVisible } = storeToRefs(mainStore);

const visible = computed(() => {
  return width.value > 768 || menuVisible.value;
});
</script>

<template>
  <Transition name="slidemenu">
    <div v-if="visible" class="sidemenu flex flex-column h-full fixed md:relative z-5">
      <slot />
    </div>
  </Transition>
</template>
<style>
.sidemenu {
  background-color: rgba(255, 255, 255, 0.497);
  backdrop-filter: blur(6px);
  width: 20rem;
  min-width: 20rem;
  border-right: 1px solid var(--surface-border);
}
.slidemenu-enter-active,
.slidemenu-leave-active {
  transition: all 0.2s ease;
}

.slidemenu-enter-from,
.slidemenu-leave-to {
  transform: translateX(-100%);
}
</style>
