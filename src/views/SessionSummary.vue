<script lang="ts" setup>
import { computed, defineAsyncComponent, ref, watch, onMounted, onBeforeUnmount } from "vue";
import { useSessionsStore } from "../store";
import { useUsersStore } from "../store";
import { getDatabase, ref as dbRef, get, child, update } from "firebase/database";
import { getStorage, ref as storageRef, listAll, getDownloadURL } from "firebase/storage";
import Button from "primevue/button";
import Toast from "primevue/toast";
import Textarea from "primevue/textarea";
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
import { useToast } from "primevue/usetoast";
import { useI18n } from "vue-i18n";
import { getAuth } from "firebase/auth";

const { t } = useI18n();

const dialog = useDialog();
const toast = useToast();
const sessionsStore = useSessionsStore();
const usersStore = useUsersStore();
const route = useRoute();
const isProfessional = ref<boolean | null>(null);

dayjs.extend(duration);

// ----------------- NUEVO: estado de notas -----------------
const notes = ref<string>("");
const savingNotes = ref(false);
const notesLoaded = ref(false);

// Ajusta este path a tu estructura real si difiere
const getSessionPath = (session: any, ownerUserId: string) =>
  `users/${ownerUserId}/Sessions/${session.DeviceId}\\${session.SessionId}\\`;
// ----------------------------------------------------------

// Función para obtener el estado de IsProfessional desde Firebase
const fetchUserProfessionalStatus = async () => {
  if (!usersStore.userId) return;
  try {
    const db = getDatabase();
    const snapshot = await get(child(dbRef(db), `users/${usersStore.userId}/IsProfessional`));
    if (snapshot.exists()) {
      isProfessional.value = Boolean(snapshot.val());
    } else {
      isProfessional.value = false;
    }
  } catch (error) {
    console.error("Error al obtener datos de Firebase:", error);
    isProfessional.value = false;
  }
};

// Handler para resize
const handleResize = () => {
  console.log("Ventana redimensionada");
};

onMounted(() => {
  fetchUserProfessionalStatus();
  window.addEventListener("resize", handleResize);
  loadNotes(); // cargar notas al montar (si ya hay selectedSession)
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
});

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

// también recargar notas cuando cambia la sesión seleccionada
watch(
  () => sessionsStore.selectedSession?.SessionId,
  () => loadNotes()
);

const goToSession = () => {
  router.push(`/session/${sessionsStore.selectedSession?.SessionId}`);
};

const formatDate = (date: number) => {
  return dayjs.unix(date).format("DD/MM/YYYY HH:mm:ss");
};

const getDuration = () => {
  if (!sessionsStore.selectedSession) return;
  const diff =
    sessionsStore.selectedSession.SessionEndTime * 1000 -
    sessionsStore.selectedSession.SessionStartTime * 1000;

  const dur = dayjs.duration(diff);
  const hours = String(Math.floor(dur.asHours())).padStart(2, "0");
  const minutes = String(dur.minutes()).padStart(2, "0");
  const seconds = String(dur.seconds()).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
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
  if (!sessionsStore.selectedSession?.SessionOxAverage || Number(sessionsStore.selectedSession?.SessionOxAverage) === 0)
    return false;
  else if (sessionsStore.selectedSession?.SessionOxCT90 === "100" && sessionsStore.selectedSession?.SessionOxCT80 === "100")
    return false;
  else if (sessionsStore.selectedSession?.SessionOxCT90 === "1" && sessionsStore.selectedSession?.SessionOxCT80 === "1")
    return false;
  else return true;
});

const hasMovementData = computed(() => !!sessionsStore.selectedSession?.SessionPLMIndex);

// Computed basado en el valor actualizado desde Firebase
const showOptionalElements = computed(() => !!isProfessional.value || usersStore.isAdmin);

// Criterio para determinar si la sesión es inválida
const sessionError = computed(() => {
  const session = sessionsStore.selectedSession;
  if (!session) return null;

  const { SessionDuration, SessionSleepTime, SessionAwakeTime, SessionMovementSignalAverage } = session;

  if (SessionDuration <= 0) return null;

  const indeterminateTime = SessionDuration - (SessionSleepTime + SessionAwakeTime);
  const isTimeInvalid = (indeterminateTime / SessionDuration) > 0.2;

  const isMovementInvalid = typeof SessionMovementSignalAverage === "number"
    ? SessionMovementSignalAverage < 10000
    : false;

  if (isMovementInvalid) {
    return t('InvalidSession-Badsignal');
  }
  if (isTimeInvalid) {
    return t('InvalidSession-Badpossition');
  }

  return null;
});

// ----------------- NUEVO: carga y guardado de notas -----------------
const loadNotes = async () => {
  const session = sessionsStore.selectedSession;
  const ownerUserId = session?.userId ?? usersStore.userId;
  notesLoaded.value = false;
  if (!session || !ownerUserId) {
    notes.value = "";
    notesLoaded.value = true;
    return;
  }

  try {
    const db = getDatabase();
    const path = `${getSessionPath(session, ownerUserId)}/Notes`;
    const snap = await get(dbRef(db, path));
    notes.value = snap.exists() ? String(snap.val()) : "";
  } catch (e) {
    console.error("Error cargando notas:", e);
    notes.value = "";
  } finally {
    notesLoaded.value = true;
  }
};

const saveNotes = async () => {

const auth = getAuth();
 
  
  const session = sessionsStore.selectedSession;
  const ownerUserId = session?.userId ?? usersStore.userId;
  if (!session || !ownerUserId) return;


 console.log("👤 auth.uid:", auth.currentUser?.uid);
  console.log("🧩 ownerUserId:", ownerUserId);
  console.log("📂 path:", getSessionPath(session, ownerUserId));

  try {
    savingNotes.value = true;
    const db = getDatabase();
    const path = getSessionPath(session, ownerUserId);
    await update(dbRef(db, path), {
      Notes: notes.value,
      NotesUpdatedAt: Date.now(),
    });

    toast.add({
      severity: "success",
      summary: t("Notas guardadas"),
      detail: t("Las notas se han guardado correctamente."),
      life: 4000,
    });
  } catch (e: any) {
    toast.add({
      severity: "error",
      summary: t("Error"),
      detail: e?.message ?? t("No se pudieron guardar las notas."),
      life: 6000,
    });
  } finally {
    savingNotes.value = false;
  }
};
// -------------------------------------------------------------------

const downloadReport = async () => {
  const session = sessionsStore.selectedSession;
  const usersStore = useUsersStore();
  if (!session) return;

  const ownerUserId = session.userId ?? usersStore.userId;
  const deviceId = session.DeviceId;
  const sessionId = session.SessionId;

  if (!ownerUserId) {
    toast.add({
      severity: "warn",
      summary: t("Download report"),
      detail: "No se encontró el usuario de la sesión",
      life: 5000,
    });
    return;
  }

  try {
    // 🕐 Mostrar mensaje de espera
    toast.add({
      severity: "info",
      summary: t("Generando informe"),
      detail: "El PDF se está generando, por favor espere...",
      group: "report",
      life: 10000,
    });

    console.log("🧠 MODE:", import.meta.env.MODE);
    console.log("🧠 API base URL:", import.meta.env.VITE_API_BASE_URL);
    console.log("✅ sessionId:", sessionId);
    console.log("✅ API base:", import.meta.env.VITE_API_BASE_URL);

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

    const response = await fetch(`${apiBaseUrl}/reporte`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: ownerUserId,
        deviceId,
        sessionId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error HTTP ${response.status}: ${await response.text()}`);
    }

    const result = await response.json();
    console.log("✅ Respuesta del servidor:", result);

    if (!result.url) {
      throw new Error("El servidor no devolvió la URL del PDF.");
    }

    const pdfResp = await fetch(result.url);

    if (!pdfResp.ok) {
      throw new Error("No se pudo descargar el PDF desde Firebase Storage");
    }

    const blob = await pdfResp.blob();

    // Descargar en el navegador
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${sessionId}_report.pdf`;
    link.click();
    URL.revokeObjectURL(link.href);

    await new Promise((r) => setTimeout(r, 100));
    toast.add({
      severity: "success",
      summary: t("Download report"),
      detail: "El informe PDF se descargó correctamente",
      group: "report",
      life: 5000,
    });
  } catch (err) {
    console.error("❌ Error al generar o descargar el PDF:", err);
    const msg = err instanceof Error ? err.message : "Error al generar o descargar el informe";
    toast.add({
      severity: "error",
      summary: t("Download report"),
      group: "report",
      detail: msg,
      life: 7000,
    });
  }
};
</script>

<template>
  <div v-if="sessionsStore.selectedSession">
    <!-- ✅ Toast para mensajes del reporte -->
    <Toast group="report" position="top-right" />
    <!-- Banner de sesión inválida -->
    <div v-if="sessionError" class="invalid-session-banner">
      <p>{{ sessionError }}</p>
    </div>

    <!-- Contenido normal de la sesión -->
    <div v-else id="session-summary">
      <div class="info-banner">
        <p>
          {{
            t(
              'Disclaimer: The information provided in this application is for informational purposes only and is not intended to diagnose, treat, or provide professional medical advice. It should not be used as a substitute for consultation, evaluation, or treatment by a qualified healthcare provider. Always seek the guidance of a licensed medical professional for your specific health concerns.'
            )
          }}
        </p>
      </div>

      <section class="flex justify-content-between">
        <span>
          <h2 class="w-full text-primary m-0 text-3xl">{{ t("Session") }} #{{ sessionsStore.selectedSession?.SessionId }}</h2>
        <h3 class="w-full text-primary m-0">{{ t("Start") }}: {{ formatDate(sessionsStore.selectedSession?.SessionStartTime) }}</h3>
        <h3 class="w-full text-primary m-0">{{ t("End") }}: {{ formatDate(sessionsStore.selectedSession?.SessionEndTime) }}</h3>
        <h3 class="w-full text-primary m-0">{{ t("Strenght") }}: {{ sessionsStore.selectedSession?.SessionMovementSignalAverage }}</h3>
        <h3 class="w-full text-primary m-0">{{ t("Duration") }}: {{ getDuration() }}</h3>
        </span>
        <span v-if="showOptionalElements" class="flex align-items-center gap-2">
          <Button :label="t('Generate AI report')" class="border-round-3xl flex" icon="pi pi-file-edit" icon-pos="left" @click="openAIReportDialog()" />
          <Button :label="t('Download report')" class="border-round-3xl flex" icon="pi pi-download" icon-pos="left" @click="downloadReport()" />
        </span>
      </section>

      <section class="pt-4 w-full grid gap-3 justify-content-center sm:justify-content-start">
        <PatientSummary />
        <SleepSummary />
        <AhiSummary v-if="showOptionalElements" />
        <AudioSummary />
        <ODISummary v-if="hasOxymetryData && showOptionalElements" />
        <MovementSummary v-if="hasMovementData && showOptionalElements" />
      </section>

      <!-- NUEVO: Notas del profesional -->
      <section v-if="showOptionalElements" class="notes-card w-full grid justify-content-center sm:justify-content-start">
        <h3 class="m-0 mb-2 text-primary">{{ t('Notas del profesional') }}</h3>

        <Textarea
          v-model="notes"
          :autoResize="true"
          rows="5"
          :disabled="!notesLoaded"
          class="w-full"
          :placeholder="t('Añade observaciones clínicas de esta sesión...')"
        />

        <div class="mt-2 flex gap-2">
          <Button
            :label="savingNotes ? t('Guardando...') : t('Guardar notas')"
            icon="pi pi-save"
            class="border-round-3xl"
            :disabled="savingNotes || !notesLoaded"
            @click="saveNotes"
          />
        </div>
      </section>

      <Button
        v-if="showOptionalElements"
        :label="t('view-analysis')"
        class="btn-go border-round-3xl hidden sm:flex"
        icon="pi pi-chevron-right"
        icon-pos="right"
        @click="goToSession"
      />
    </div>
  </div>
</template>

<style>



.invalid-session-banner {
  background-color: #ffcccc;
  color: #cc0000;
  padding: 1rem;
  border: 1px solid #cc0000;
  border-radius: 5px;
  text-align: center;
  margin-bottom: 1rem;
}

.summary-card {
  background-color: #e2e2e241;
  backdrop-filter: blur(4px);
  border-radius: 10px;
  max-width: 37rem;
  min-width: 25rem;
}

.notes-card {
  background: #f6f9f8;
  border: 1px solid #d9e7e4;
  border-radius: 8px;
  padding: 1rem;
  max-width: 37rem;
  margin-top: 1rem;
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
/* En pantallas grandes (desktop) la sección de notas se expande */
@media (min-width: 1024px) {
  .notes-card {
    max-width: none;        /* Quita el límite de 37rem */
    width: 100%;            /* Ocupar todo el ancho del contenedor */
    margin-top: 2rem;
  }

  .notes-card textarea {
    width: 100%;            /* El área de texto ocupa todo el ancho */
  }
}

</style>