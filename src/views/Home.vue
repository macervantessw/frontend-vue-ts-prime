<template>
  <div class="sessions flex flex-column h-full w-full">
    <NavigationBar />
    <div class="flex h-full w-full min-h-0">
      <SideMenu v-if="!route.query.token">
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
      <router-view v-slot="{ Component, route }">
        <transition :name="'fade'" :mode="'out-in'" :duration="100">
          <component :is="Component" :key="route.path" class="w-full h-full p-2 sm:p-5 overflow-auto" />
        </transition>
      </router-view>
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
import { useRoute } from "vue-router";

const sessionsStore = useSessionsStore();
const usersStore = useUsersStore();
const route = useRoute();

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
  const startTime = Date.now();
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
  const endTime = Date.now();
  console.log("grouping took ", endTime - startTime);
  return grouped;
});

onBeforeMount(async () => {
  // sessionsStore.fetchAllPatients();
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
.grid {
  margin-right: 0 !important;
  margin-left: 0 !important;
  margin-top: 0 !important;
}
</style>
