<script lang="ts" setup>
import { computed, defineAsyncComponent, watch } from "vue";
import { useSessionsStore } from "../store";
import Button from "primevue/button";
import i18n from "../i18n";
import PatientSummary from "../components/Summary/PatientSummary.vue";
import router from "../router";
import SleepSummary from "../components/Summary/SleepSummary.vue";
import AhiSummary from "../components/Summary/RespiratorySummary.vue";
import { useRoute } from "vue-router";
import AudioSummary from "../components/Summary/AudioSummary.vue";
import ODISummary from "../components/Summary/OximetrySummary.vue";
import MovementSummary from "../components/Summary/MovementSummary.vue";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { useDialog } from "primevue/usedialog";

const dialog = useDialog();

dayjs.extend(duration);
const { t } = i18n.global;
const sessionsStore = useSessionsStore();
const route = useRoute();

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

const goToSession = () => {
  router.push(`/session/${sessionsStore.selectedSession?.SessionId}`);
};

const formatDate = (date: number) => {
  return dayjs.unix(date).format("DD/MM/YYYY HH:mm:ss");
};
const getDuration = () => {
  if (!sessionsStore.selectedSession) return;
  return dayjs.duration(sessionsStore.selectedSession?.SessionEndTime * 1000 - sessionsStore.selectedSession?.SessionStartTime * 1000).format("HH:mm:ss");
};
const AIReportDialog = defineAsyncComponent(() => import("../components/Summary/AIReportDialog.vue"));
const openAIReportDialog = () => {
  dialog.open(AIReportDialog, {
    props: {
      header: t("ai-generated-repport"),
      style: {
        width: "50vw",
      },
      breakpoints: {
        "960px": "75vw",
        "640px": "100vw",
      },
      modal: true,
    },
  });
};

const hasOxymetryData = computed(() => {
  if (!sessionsStore.selectedSession?.SessionOxAverage || Number(sessionsStore.selectedSession?.SessionOxAverage) === 0) return false;
  else if (sessionsStore.selectedSession?.SessionOxCT90 === "100" && sessionsStore.selectedSession?.SessionOxCT80 === "100") return false;
  else if (sessionsStore.selectedSession?.SessionOxCT90 === "1" && sessionsStore.selectedSession?.SessionOxCT80 === "1") return false;
  else return true;
});

const hasMovementData = computed(() => {
  return !sessionsStore.selectedSession?.SessionPLMIndex ? false : true;
});
</script>
<template>
  <div v-if="sessionsStore.selectedSession" id="session-summary" class="">
    <section class="flex justify-content-between">
      <span>
        <h2 class="w-full text-primary m-0 text-3xl">{{ $t("Session") }} #{{ sessionsStore.selectedSession?.SessionId }}</h2>
        <h3 class="w-full text-primary m-0">{{ $t("Start") }}: {{ formatDate(sessionsStore.selectedSession?.SessionStartTime) }}</h3>
        <h3 class="w-full text-primary m-0">{{ $t("End") }}: {{ formatDate(sessionsStore.selectedSession?.SessionEndTime) }}</h3>
        <h3 class="w-full text-primary m-0">{{ $t("Duration") }}: {{ getDuration() }}</h3>
      </span>
      <span class="flex align-items-center">
        <Button :label="t('Generate AI report')" class="border-round-3xl flex" icon="pi pi-file-edit" icon-pos="left" @click="openAIReportDialog()" />
      </span>
    </section>
    <section class="pt-4 w-full grid gap-3 justify-content-center sm:justify-content-start">
      <PatientSummary />
      <SleepSummary />
      <AhiSummary />
      <AudioSummary />
      <ODISummary v-if="hasOxymetryData" />
      <MovementSummary v-if="hasMovementData" />
    </section>
    <Button :label="t('view-analysis')" class="btn-go border-round-3xl hidden sm:flex" icon="pi pi-chevron-right" icon-pos="right" @click="goToSession"></Button>
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
  width: 100%;
}

.btn-go:active {
  bottom: 2px;
}
</style>
<style lang="scss">
.ai-button {
  --b: 0.5em; /* border width */
  --c: 3em; /* corner size */
  --r: 2em; /* corner rounding */
  position: relative;
  margin: 1em auto;
  border: solid var(--b) transparent;
  padding: 1em;
  max-width: 23em;
  font:
    1.25em ubuntu,
    sans-serif;

  &::before {
    position: absolute;
    z-index: -1;
    inset: calc(-1 * var(--b));
    border: inherit;
    border-radius: var(--r);
    background: linear-gradient(orange, deeppink, purple) border-box;
    --corner: conic-gradient(from -90deg at var(--c) var(--c), red 25%, #0000 0) 0 0 / calc(100% - var(--c)) calc(100% - var(--c)) border-box;
    --inner: conic-gradient(red 0 0) padding-box;
    -webkit-mask: var(--corner), var(--inner);
    -webkit-mask-composite: source-out;
    mask:
      var(--corner) subtract,
      var(--inner);
    content: "";
  }
}
</style>
