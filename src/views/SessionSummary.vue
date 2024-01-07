<script lang="ts" setup>
import { ref, watch } from "vue";
import { useSessionsStore } from "../store";
import Button from "primevue/button";
import i18n from "../i18n";
import PatientSummary from "../components/Summary/PatientSummary.vue";
// import router from "../router";
import SleepSummary from "../components/Summary/SleepSummary.vue";
import AhiSummary from "../components/Summary/RespiratorySummary.vue";
import { useRoute } from "vue-router";
import AudioSummary from "../components/Summary/AudioSummary.vue";
import ODISummary from "../components/Summary/OximetrySummary.vue";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import Session from "./Session.vue";

dayjs.extend(duration);
const { t } = i18n.global;
const sessionsStore = useSessionsStore();
const route = useRoute();
const summaryContainer = ref<HTMLElement | null>(null);

if (route.params.sessionId) {
  const session = sessionsStore.sessions.find((session) => session.SessionId === route.params.sessionId);
  if (session) sessionsStore.selectedSession = session;
}

watch(
  () => sessionsStore.sessions,
  (sessions) => {
    const session = sessions.find((session) => session.SessionId === route.params.sessionId);
    if (session) sessionsStore.selectedSession = session;
  },
  { deep: true },
);

watch(
  () => sessionsStore.showSessionAnalysis,
  (showSessionAnalysis) => {
    if (showSessionAnalysis) {
      summaryContainer.value?.classList.add("opacity-0");
      summaryContainer.value?.classList.add("hidden");
    } else {
      summaryContainer.value?.classList.remove("opacity-0");
      summaryContainer.value?.classList.remove("hidden");
    }
  },
  { deep: true },
);

const goToSession = () => {
  // router.push(`/session/${sessionsStore.selectedSession?.SessionId}`);
  sessionsStore.showSessionAnalysis = true;
};

const formatDate = (date: number) => {
  return dayjs.unix(date).format("DD/MM/YYYY HH:mm:ss");
};
const getDuration = () => {
  if (!sessionsStore.selectedSession) return;
  return dayjs.duration(sessionsStore.selectedSession?.SessionEndTime * 1000 - sessionsStore.selectedSession?.SessionStartTime * 1000).format("HH:mm:ss");
};
</script>
<template>
  <div v-if="sessionsStore.selectedSession" class="relative flex w-full">
    <div id="session-summary" ref="summaryContainer" class="z-5 absolute w-full h-full p-2 sm:p-5 overflow-auto">
      <h2 class="w-full text-primary m-0 text-3xl">{{ $t("Session") }} #{{ sessionsStore.selectedSession?.SessionId }}</h2>
      <h3 class="w-full text-primary m-0">{{ $t("Start") }}: {{ formatDate(sessionsStore.selectedSession?.SessionStartTime) }}</h3>
      <h3 class="w-full text-primary m-0">{{ $t("End") }}: {{ formatDate(sessionsStore.selectedSession?.SessionEndTime) }}</h3>
      <h3 class="w-full text-primary m-0">{{ $t("Duration") }}: {{ getDuration() }}</h3>
      <section class="pt-4 w-full grid gap-3 justify-content-center sm:justify-content-start relative">
        <PatientSummary />
        <SleepSummary />
        <AhiSummary />
        <AudioSummary />
        <ODISummary />
        <Button :label="t('view-analysis')" class="btn-go border-round-3xl hidden sm:flex" icon="pi pi-chevron-right" icon-pos="right" @click="goToSession"></Button>
      </section>
    </div>
    <div class="absolute opacity-0 w-full h-full p-2 sm:p-5 overflow-auto" :class="{ 'opacity-100': sessionsStore.showSessionAnalysis }">
      <Session />
    </div>
  </div>
</template>
<style>
.summary-card {
  background-color: #e2e2e241;
  backdrop-filter: blur(4px);
  border-radius: 10px;
  max-width: 37rem;
  min-width: 25rem;
}
.btn-go {
  position: absolute;
  bottom: 0;
  right: 0;
  margin: 1.5rem;
  font-size: 1.75rem;
  font-weight: 700;
  cursor: pointer;
  border: 2px solid rgb(255, 255, 255);
  z-index: 1;
  color: white;
  transition: all 0.3s ease;
}

.btn-go:after {
  position: absolute;
  content: "";
  width: 0;
  height: 100%;
  bottom: 0;
  right: 0;
  direction: ltr;
  z-index: -1;
  background: #117064;
  transition: all 0.3s ease;
}

.btn-go:hover {
  color: rgb(0, 0, 0);
}

.btn-go:hover:after {
  right: auto;
  left: 0;
  bottom: 0;
  width: 100%;
}

.btn-go:active {
  bottom: 2px;
}
</style>
