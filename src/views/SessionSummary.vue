<script lang="ts" setup>
import { storeToRefs } from "pinia";
import router from "../router";
import { useSessionsStore } from "../store";
import PatientSummary from "../components/Summary/PatientSummary.vue";
import Button from "primevue/button";
import i18n from "../i18n";

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
    </div>
    <Button
      :label="t('view-analysys')"
      class="absolute bottom-0 right-0 m-4 text-3xl font-bold cursor-pointer border-round-3xl"
      icon="pi pi-chevron-right"
      icon-pos="right"
      @click="goToSession"
    ></Button>
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
</style>
