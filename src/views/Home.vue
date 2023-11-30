<template>
  <div class="sessions flex flex-column h-full w-full">
    <NavigationBar />
    <div class="home w-full h-full flex justify-content-center p-5">
      <router-view v-slot="{ Component, route }">
        <transition :name="'fade'" :mode="'out-in'">
          <component :is="Component" :key="route.path" />
        </transition>
      </router-view>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { useSessionsStore } from "../store";
import { onBeforeMount } from "vue";
import NavigationBar from "../components/NavigationBar.vue";
const sessionsStore = useSessionsStore();

onBeforeMount(async () => {
  sessionsStore.fetchAllPatients();
  sessionsStore.fetchAllSessions();
});
</script>
<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.5s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
