<template>
  <div class="sessions flex flex-column h-full w-full">
    <NavigationBar />
    <div class="flex h-full w-full">
      <SideMenu>
        <div>
          <MenuItem v-for="(session, index) in sessionsSorted" :key="index" :session="session" />
        </div>
      </SideMenu>
      <div class="home w-full h-full flex justify-content-center p-5">
        <router-view v-slot="{ Component, route }">
          <transition :name="'fade'" :mode="'out-in'" :duration="100">
            <component :is="Component" :key="route.path" />
          </transition>
        </router-view>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { useSessionsStore } from "../store";
import { computed, onBeforeMount } from "vue";
import NavigationBar from "../components/NavigationBar.vue";
import MenuItem from "../components/MenuItem.vue";
import SideMenu from "../components/SideMenu.vue";
const sessionsStore = useSessionsStore();

const sessionsSorted = computed(() => {
  return sessionsStore.sessions.toSorted((a, b) => {
    return Number(b.SessionId) - Number(a.SessionId);
  });
});

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
