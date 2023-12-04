<script lang="ts" setup>
import { storeToRefs } from "pinia";
import { useSessionsStore } from "../store";
import Button from "primevue/button";
import i18n from "../i18n";
import PatientSummary from "../components/Summary/PatientSummary.vue";
import router from "../router";
import SleepSummary from "../components/Summary/SleepSummary.vue";

const { t } = i18n.global;
const sessionsStore = useSessionsStore();
const { selectedSession } = storeToRefs(sessionsStore);

const goToSession = () => {
  router.push(`/session/${sessionsStore.selectedSession?.SessionId}`);
};
</script>
<template>
  <div class="flex flex-column h-full w-full">
    <h1 class="w-full text-primary">{{ $t("Session") }} {{ selectedSession?.SessionId }}</h1>
    <div class="pt-4 w-full grid gap-3">
      <PatientSummary class="summary-card p-4 col-12 md:col-6 lg:col-4 shadow-1 flex flex-column text-xl font-semibold text-700" />
      <SleepSummary class="summary-card p-4 col-12 md:col-6 lg:col-4 shadow-1 flex flex-column text-xl font-semibold text-700" />
    </div>
    <Button :label="t('view-analysys')" class="btn-go border-round-3xl" icon="pi pi-chevron-right" icon-pos="right" @click="goToSession"></Button>
  </div>
</template>
<style>
.summary-card {
  background-color: #e2e2e269;
  border: 1px solid rgba(204, 204, 204, 0.15);
  backdrop-filter: blur(6px);
  border-radius: 10px;
  max-width: 30rem;
}
.btn-go {
  position: absolute;
  bottom: 0;
  right: 0;
  margin: 1.5rem;
  font-size: 1.75rem;
  font-weight: 700;
  cursor: pointer;

  transition: all 0.3s ease;
}
.btn-go {
  border: 2px solid rgb(255, 255, 255);
  z-index: 1;
  color: white;
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
