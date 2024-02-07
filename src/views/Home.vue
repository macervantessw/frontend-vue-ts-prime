<template>
  <div class="sessions flex flex-column h-full w-full">
    <NavigationBar />
    <div class="flex h-full w-full min-h-0">
      <SideMenu v-if="!route.query.token">
        <div class="flex align-items-center w-full">
          <span class="p-input-icon-left w-full">
            <i class="pi pi-search" />
            <InputText v-model="searchText" class="w-full my-1" :placeholder="$t('Search')" />
          </span>
        </div>
        <div v-if="usersStore.isAdmin">
          <Accordion :key="sessionsGrouped" :active-index="0">
            <AccordionTab v-for="(user, userId) in sessionsGrouped" :key="userId" :header="userId.toString()">
              <Accordion :key="user" :active-index="0">
                <AccordionTab v-for="(device, deviceName) in user" :key="deviceName" :header="deviceName.toString()">
                  <MenuItem v-for="(session, index) in device" :key="index" :session="session" />
                </AccordionTab>
              </Accordion>
            </AccordionTab>
          </Accordion>
        </div>
        <div v-else>
          <Accordion :active-index="0">
            <AccordionTab v-for="(device, deviceId) in groupedByDevice" :key="deviceId" :header="deviceId.toString()">
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
import InputText from "primevue/inputtext";
import { ref } from "vue";

const sessionsStore = useSessionsStore();
const usersStore = useUsersStore();
const route = useRoute();
const searchText = ref("");

const groupedByDevice = computed(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const grouped: any = {};
  sessionsStore.sessions
    .filter((session) => {
      if (!searchText.value) return true;
      return (
        session.Name?.toLowerCase().includes(searchText.value.toLowerCase()) ||
        session.Surname?.toLowerCase().includes(searchText.value.toLowerCase()) ||
        session.SessionId?.toLowerCase().includes(searchText.value.toLowerCase())
      );
    })
    .forEach((session) => {
      if (grouped[session.DeviceId]) grouped[session.DeviceId].push(session);
      else grouped[session.DeviceId] = [session];
    });

  return grouped;
});

const sessionsGrouped = computed(() => {
  return sessionsStore.sessions
    .filter((session) => {
      if (!searchText.value) return true;
      return (
        session.Name?.toLowerCase().includes(searchText.value.toLowerCase()) ||
        session.Surname?.toLowerCase().includes(searchText.value.toLowerCase()) ||
        session.SessionId?.toLowerCase().includes(searchText.value.toLowerCase())
      );
    })
    .reduce((grouped, session) => {
      if (!grouped[session.userId]) {
        grouped[session.userId] = {};
      }
      if (!grouped[session.userId][session.DeviceId]) {
        grouped[session.userId][session.DeviceId] = [];
      }
      grouped[session.userId][session.DeviceId].push(session);
      return grouped;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }, {} as any);
});

onBeforeMount(async () => {
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
