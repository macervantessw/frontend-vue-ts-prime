<template>
  <div class="sessions flex flex-column h-full w-full">
    <NavigationBar />
    <div class="flex h-full w-full">
      <SideMenu>
        <div v-if="usersStore.isAdmin">
          <Accordion :active-index="0">
            <AccordionTab v-for="(user, index) in sessionsGrouped" :key="index" :header="index.toString()">
              <Accordion :active-index="0">
                <AccordionTab v-for="(device, index) in user" :key="index" :header="index.toString()">
                  <MenuItem v-for="(session, index) in device" :key="index" :session="session" />
                </AccordionTab>
              </Accordion>
            </AccordionTab>
          </Accordion>
        </div>
        <div v-else>
          <Accordion :active-index="0">
            <AccordionTab v-for="(device, index) in groupedByDevice" :key="index" :header="index.toString()">
              <MenuItem v-for="(session, index) in device" :key="index" :session="session" />
            </AccordionTab>
          </Accordion>
        </div>
      </SideMenu>
      <div class="home w-full h-full flex justify-content-center p-2 sm:p-5">
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
import { useSessionsStore, useUsersStore } from "../store";
import { computed, onBeforeMount } from "vue";
import NavigationBar from "../components/NavigationBar.vue";
import MenuItem from "../components/MenuItem.vue";
import SideMenu from "../components/SideMenu.vue";
import Accordion from "primevue/accordion";
import AccordionTab from "primevue/accordiontab";

const sessionsStore = useSessionsStore();
const usersStore = useUsersStore();

const groupedByDevice = computed(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const grouped: any = {};
  sessionsStore.sessions.forEach((session) => {
    if (grouped[session.DeviceId]) grouped[session.DeviceId].push(session);
    else grouped[session.DeviceId] = [session];
  });
  return grouped;
});

const sessionsGrouped = computed(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const grouped: any = {};
  sessionsStore.sessions.forEach((session) => {
    if (grouped[session.userId]) {
      if (grouped[session.userId][session.DeviceId]) grouped[session.userId][session.DeviceId].push(session);
      else grouped[session.userId][session.DeviceId] = [session];
    } else {
      grouped[session.userId] = {};
      grouped[session.userId][session.DeviceId] = [session];
    }
  });
  return grouped;
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
.p-accordion .p-accordion-content {
  padding: 5px 0 0 10px !important;
}
span.p-accordion-header-text {
  white-space: nowrap;
  overflow: hidden;
}
</style>
