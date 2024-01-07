<script lang="ts" setup>
import { PropType } from "vue";
import { Session } from "../interfaces";
import dayjs from "dayjs";
import { useMainStore, useSessionsStore, useChartsStore } from "../store";

const sessionsStore = useSessionsStore();
const mainStore = useMainStore();
const chartsStore = useChartsStore();

const props = defineProps({
  session: {
    type: Object as PropType<Session>,
    required: true,
  },
});

const sessionDate = () => {
  const date = dayjs.unix(Number(props.session.SessionId));
  return date.format("DD/MM/YYYY HH:mm");
};

const goToSessionSummary = () => {
  sessionsStore.selectedSession = props.session;
  sessionsStore.showSessionAnalysis = false;
  mainStore.menuVisible = false;
  chartsStore.setNotRendered();
};
</script>
<template>
  <div class="m-2">
    <router-link
      class="menuitem p-2 shadow-1 flex w-full justify-content-between cursor-pointer"
      :class="{ active: $route.params.sessionId === session.SessionId }"
      active-class="active shadow-4"
      :to="`/sessionSummary/${session.SessionId}`"
      @click="goToSessionSummary()"
    >
      <div class="flex flex-column">
        <span class="font-bold text-lg overflow-hidden">{{ session.PatientName || session.Name }} {{ session.Surname || session.PatientSurname }}</span>
        <span>{{ sessionDate() }}</span>
      </div>
      <span class="flex align-items-center">
        <i class="pi pi-chevron-right" />
      </span>
    </router-link>
  </div>
</template>
<style>
.menuitem {
  background-color: #117063;
  color: white;
}
.menuitem:hover,
.menuitem.active {
  background-color: #3e9288fe;
}
</style>
