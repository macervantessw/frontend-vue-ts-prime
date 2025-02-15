<script lang="ts" setup>
import { computed } from "vue";
import { useSessionsStore } from "../store";
import i18n from "../i18n";
import { useRoute, useRouter } from "vue-router";
import Button from "primevue/button";
import PatientSummary from "../components/Summary/PatientSummary.vue";
import SleepSummary from "../components/Summary/SleepSummary.vue";
import AhiSummary from "../components/Summary/RespiratorySummary.vue";
import AudioSummary from "../components/Summary/AudioSummary.vue";
import ODISummary from "../components/Summary/OximetrySummary.vue";
import MovementSummary from "../components/Summary/MovementSummary.vue";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { useDialog } from "primevue/usedialog";

// Extender dayjs para soporte de duraciones
dayjs.extend(duration);

// Internacionalización
const { t } = i18n.global;

// Estado global
const sessionsStore = useSessionsStore();
const route = useRoute();
const dialog = useDialog();
const router = useRouter();

// Computadas para verificar la disponibilidad de datos
const hasOxymetryData = computed(() => {
  if (
    !sessionsStore.selectedSession?.SessionOxAverage ||
    Number(sessionsStore.selectedSession?.SessionOxAverage) === 0
  )
    return false;
  else if (
    sessionsStore.selectedSession?.SessionOxCT90 === "100" &&
    sessionsStore.selectedSession?.SessionOxCT80 === "100"
  )
    return false;
  else if (
    sessionsStore.selectedSession?.SessionOxCT90 === "1" &&
    sessionsStore.selectedSession?.SessionOxCT80 === "1"
  )
    return false;
  else return true;
});

const hasMovementData = computed(() => {
  return !!sessionsStore.selectedSession?.SessionPLMIndex;
});

// Importación sincrónica del diálogo AIReport
import AIReportDialog from "../components/Summary/AIReportDialog.vue";

// Función para abrir el diálogo de informe AI
const openAIReportDialog = () => {
  dialog.open(AIReportDialog, {
    props: {
      header: t("ai-generated-report"),
      style: { width: "50vw" },
      breakpoints: { "960px": "75vw", "640px": "100vw" },
      modal: true,
    },
  });
};

// Función para navegar a la vista de sesión
const goToSession = () => {
  router.push(`/session/${sessionsStore.selectedSession?.SessionId}`);
};

// Formateo de fechas
const formatDate = (date: number) => {
  return dayjs.unix(date).format("DD/MM/YYYY HH:mm:ss");
};

// Cálculo de duración
const getDuration = () => {
  if (!sessionsStore.selectedSession) return "";
  const startTime = sessionsStore.selectedSession.SessionStartTime * 1000;
  const endTime = sessionsStore.selectedSession.SessionEndTime * 1000;
  return dayjs.duration(endTime - startTime).format("HH:mm:ss");
};
</script>

<template>
  <div v-if="sessionsStore.selectedSession" id="session-summary">
    <!-- Mensaje Fijo -->
    <div class="info-banner">
      <p>
        {{ $t("Disclaimer: The information provided in this application is for informational purposes only and is not intended to diagnose, treat, or provide professional medical advice.") }}
      </p>
    </div>

    <!-- Sección Principal -->
    <section class="flex justify-content-between">
      <span>
        <h2 class="w-full text-primary m-0 text-3xl">
          {{ $t("Session") }} #{{ sessionsStore.selectedSession?.SessionId }}
        </h2>
        <h3 class="w-full text-primary m-0">
          {{ $t("Start") }}: {{ formatDate(sessionsStore.selectedSession?.SessionStartTime) }}
        </h3>
        <h3 class="w-full text-primary m-0">
          {{ $t("End") }}: {{ formatDate(sessionsStore.selectedSession?.SessionEndTime) }}
        </h3>
        <h3 class="w-full text-primary m-0">
          {{ $t("Duration") }}: {{ getDuration() }}
        </h3>
      </span>
      <span class="flex align-items-center">
        <!-- Botón Generate AI Report -->
        <Button
          :label="t('Generate AI report')"
          class="border-round-3xl flex mb-4"
          icon="pi pi-file-edit"
          icon-pos="left"
          @click="openAIReportDialog()"
        />
      </span>
    </section>

    <!-- Resúmenes -->
    <section class="pt-4 w-full grid gap-3 justify-content-center sm:justify-content-start">
      <PatientSummary />
      <SleepSummary />
      <AhiSummary />
      <ODISummary v-if="hasOxymetryData" />
      <MovementSummary v-if="hasMovementData" />
      <AudioSummary />
    </section>

    <!-- Botón Advanced View -->
    <Button
      :label="t('view-analysis')"
      class="btn-go border-round-3xl hidden sm:flex"
      icon="pi pi-chevron-right"
      icon-pos="right"
      @click="goToSession"
    />
  </div>
</template>

<style>
/* Estilos básicos */
.summary-card {
  background-color: rgba(226, 226, 226, 0.7); /* Cambiar backdrop-filter por un color sólido */
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

.btn-go:hover {
  color: rgb(0, 0, 0);
  background-color: #117064; /* Cambiar efecto hover para compatibilidad */
}

.info-banner {
  background-color: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 5px;
  margin-bottom: 1rem;
}
</style>