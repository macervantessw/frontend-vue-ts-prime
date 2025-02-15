<script lang="ts" setup>
import { computed, ref, onMounted, onUnmounted, defineAsyncComponent } from "vue";
import { useSessionsStore } from "../store";
import i18n from "../i18n";
import { useRoute } from "vue-router";
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
import { useRouter } from "vue-router";


dayjs.extend(duration);

const { t } = i18n.global;
const sessionsStore = useSessionsStore();
const route = useRoute();
const dialog = useDialog();

// Variable reactiva para controlar la visualización avanzada
const showAdvancedSummaries = ref(true);

// Umbral para dispositivos móviles (puedes ajustarlo según tus necesidades)
const MOBILE_THRESHOLD = 900; // px

// Función para detectar el tamaño de la pantalla
const updateShowAdvancedSummaries = () => {
  showAdvancedSummaries.value = window.innerWidth >= MOBILE_THRESHOLD;
};

// Observar cambios en el tamaño de la ventana
onMounted(() => {
  updateShowAdvancedSummaries(); // Inicializar al montar el componente
  window.addEventListener("resize", updateShowAdvancedSummaries);
});

onUnmounted(() => {
  window.removeEventListener("resize", updateShowAdvancedSummaries);
});

// Computadas para verificar la disponibilidad de datos
const hasOxymetryData = computed(() => {
  if (!sessionsStore.selectedSession?.SessionOxAverage || Number(sessionsStore.selectedSession?.SessionOxAverage) === 0) return false;
  else if (sessionsStore.selectedSession?.SessionOxCT90 === "100" && sessionsStore.selectedSession?.SessionOxCT80 === "100") return false;
  else if (sessionsStore.selectedSession?.SessionOxCT90 === "1" && sessionsStore.selectedSession?.SessionOxCT80 === "1") return false;
  else return true;
});

const hasMovementData = computed(() => {
  return !sessionsStore.selectedSession?.SessionPLMIndex ? false : true;
});

// Función para abrir el diálogo de informe AI
const AIReportDialog = defineAsyncComponent(() => import("../components/Summary/AIReportDialog.vue"));
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


const router = useRouter(); // Inicializa el enrutador
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
  return dayjs.duration(
    sessionsStore.selectedSession.SessionEndTime * 1000 - sessionsStore.selectedSession.SessionStartTime * 1000
  ).format("HH:mm:ss");
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
        <h2 class="w-full text-primary m-0 text-3xl">{{ $t("Session") }} #{{ sessionsStore.selectedSession?.SessionId }}</h2>
        <h3 class="w-full text-primary m-0">{{ $t("Start") }}: {{ formatDate(sessionsStore.selectedSession?.SessionStartTime) }}</h3>
        <h3 class="w-full text-primary m-0">{{ $t("End") }}: {{ formatDate(sessionsStore.selectedSession?.SessionEndTime) }}</h3>
        <h3 class="w-full text-primary m-0">{{ $t("Duration") }}: {{ getDuration() }}</h3>
      </span>
      <span class="flex align-items-center">
        <!-- Botón Generate AI Report -->
        <Button 
          :label="t('Generate AI report')" 
          class="border-round-3xl flex mb-4" 
          icon="pi pi-file-edit" 
          icon-pos="left" 
          @click="openAIReportDialog()" 
          v-if="showAdvancedSummaries"
        />
      </span>
    </section>

    <!-- Resúmenes -->
    <section class="pt-4 w-full grid gap-3 justify-content-center sm:justify-content-start">
      <PatientSummary />
      <SleepSummary />

      <!-- AhiSummary -->
      <AhiSummary v-if="showAdvancedSummaries" />

      <!-- ODISummary -->
      <ODISummary v-if="showAdvancedSummaries && hasOxymetryData" />

      <!-- MovementSummary -->
      <MovementSummary v-if="showAdvancedSummaries && hasMovementData" />

      <AudioSummary />
    </section>

    <!-- Botón Advanced View -->
    <Button 
      :label="t('view-analysis')" 
      class="btn-go border-round-3xl hidden sm:flex" 
      icon="pi pi-chevron-right" 
      icon-pos="right" 
      @click="goToSession" 
      v-if="showAdvancedSummaries"
    />
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

.info-banner {
  background-color: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 5px;
  margin-bottom: 1rem;
}
</style>
