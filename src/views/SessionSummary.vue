<script lang="ts" setup>
import {
  computed,
  defineAsyncComponent,
  ref,
  watch,
  onMounted,
  onBeforeUnmount
} from "vue";

import { useSessionsStore } from "../store";
import { useUsersStore } from "../store";

import {
  getDatabase,
  ref as dbRef,
  get,
  child,
  update
} from "firebase/database";

import {
  getStorage,
  ref as storageRef,
  getDownloadURL,
  uploadBytes
} from "firebase/storage";

import Button from "primevue/button";
import Toast from "primevue/toast";
import router from "../router";
import { useRoute } from "vue-router";

import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";

import { useDialog } from "primevue/usedialog";
import { useToast } from "primevue/usetoast";
import { useI18n } from "vue-i18n";
import { getAuth } from "firebase/auth";

// TABS
import SummaryTab from "../components/Tabs/SummaryTab.vue";
import ClinicalTab from "../components/Tabs/ClinicalTab.vue";
import DocumentsTab from "../components/Tabs/DocumentsTab.vue";
import AISection from "../components/Tabs/AISection.vue";

const { t, locale } = useI18n(); // ✅ AQUÍ EL CAMBIO IMPORTANTE
const toast = useToast();
const dialog = useDialog();
const route = useRoute();

const sessionsStore = useSessionsStore();
const usersStore = useUsersStore();

/* ============================================================
   ✅ APLICAR IDIOMA DE LA SESIÓN
============================================================ */
const applySessionLanguage = (session: any) => {
  if (!session?.Lang) return;

  const supported = ["es", "en", "it"];

  if (supported.includes(session.Lang)) {
    locale.value = session.Lang;
    console.log("🌍 Idioma de sesión aplicado:", session.Lang);
  } else {
    console.warn("⚠️ Idioma de sesión no soportado:", session.Lang);
  }
};

/* ============================================================
   PROFESSIONAL / ADMIN FLAG
============================================================ */
const isProfessional = ref<boolean | null>(null);

const fetchUserProfessionalStatus = async () => {
  if (!usersStore.userId) return;

  try {
    const db = getDatabase();
    const snap = await get(child(dbRef(db), `users/${usersStore.userId}/IsProfessional`));
    isProfessional.value = snap.exists() ? Boolean(snap.val()) : false;
  } catch {
    isProfessional.value = false;
  }
};

/* ============================================================
   NOTES
============================================================ */
dayjs.extend(duration);

const notes = ref<string>("");
const savingNotes = ref(false);
const notesLoaded = ref(false);

const getSessionPath = (session: any, ownerId: string) =>
  `users/${ownerId}/Sessions/${session.DeviceId}\\${session.SessionId}\\`;

/* ✅ Load session from route + aplicar idioma */
if (route.params.sessionId) {
  const session = sessionsStore.sessions.find(
    (s) => s.SessionId === route.params.sessionId
  );
  if (session) {
    sessionsStore.selectedSession = session;
    applySessionLanguage(session); // ✅ AQUÍ
  }
}

/* ✅ Watch de sesiones + aplicar idioma */
watch(
  () => sessionsStore.sessions,
  () => {
    const session = sessionsStore.sessions.find(
      (s) => s.SessionId === route.params.sessionId
    );
    if (session) {
      sessionsStore.selectedSession = session;
      applySessionLanguage(session); // ✅ AQUÍ TAMBIÉN
    }
  },
  { deep: true }
);

onMounted(() => {
  fetchUserProfessionalStatus();
  window.addEventListener("resize", handleResize);
  loadNotes();
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
});

const handleResize = () => {};

/* ============================================================
   Load / save notes
============================================================ */
const loadNotes = async () => {
  const s = sessionsStore.selectedSession;
  const owner = s?.userId ?? usersStore.userId;

  notesLoaded.value = false;

  if (!s || !owner) {
    notes.value = "";
    notesLoaded.value = true;
    return;
  }

  try {
    const snap = await get(dbRef(getDatabase(), `${getSessionPath(s, owner)}/Notes`));
    notes.value = snap.exists() ? String(snap.val()) : "";
  } finally {
    notesLoaded.value = true;
  }
};

const saveNotes = async () => {
  const s = sessionsStore.selectedSession;
  const owner = s?.userId ?? usersStore.userId;

  if (!s || !owner) return;

  try {
    savingNotes.value = true;

    await update(dbRef(getDatabase(), getSessionPath(s, owner)), {
      Notes: notes.value,
      NotesUpdatedAt: Date.now()
    });

    toast.add({
      severity: "success",
      summary: t("Notas guardadas"),
      detail: t("Las notas se han guardado correctamente."),
      life: 3000
    });
  } finally {
    savingNotes.value = false;
  }
};

/* ============================================================
   REPORT PDF DOWNLOAD
============================================================ */
const downloadReport = async () => {
  const s = sessionsStore.selectedSession;
  const store = useUsersStore();

  if (!s) return;

  const owner = s.userId ?? store.userId;
  if (!owner) return;

  try {
    toast.add({
      severity: "info",
      summary: t("Generando informe"),
      detail: t("Por favor, espere..."),
      group: "report",
      life: 5000
    });

    const apiBase = import.meta.env.VITE_API_BASE_URL;

    const resp = await fetch(`${apiBase}/reporte`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: owner,
        deviceId: s.DeviceId,
        sessionId: s.SessionId
      })
    });

    const result = await resp.json();
    if (!result.url) throw new Error("No URL returned");

    const pdfResp = await fetch(result.url);
    const blob = await pdfResp.blob();

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${s.SessionId}_report.pdf`;
    link.click();
    URL.revokeObjectURL(link.href);

    toast.add({
      severity: "success",
      summary: t("Download report"),
      detail: t("Informe descargado"),
      group: "report"
    });
  } catch (err) {
    toast.add({
      severity: "error",
      summary: t("Error"),
      detail: t("No se pudo descargar el informe"),
      group: "report"
    });
  }
};

/* ============================================================
   PDF UPLOAD
============================================================ */
const pdfInput = ref<HTMLInputElement | null>(null);
const uploadingPdf = ref(false);

const triggerPdfSelect = () => pdfInput.value?.click();

const onPdfSelected = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) return;

  await uploadPdf(file);
  target.value = "";
};

const uploadPdf = async (file: File) => {
  const s = sessionsStore.selectedSession;
  const owner = s?.userId ?? usersStore.userId;

  if (!s || !owner) return;

  try {
    uploadingPdf.value = true;
    const storage = getStorage();

    const path = `Sessions/${owner}/${s.DeviceId}/${s.SessionId}_${file.name}`;
    const fileRef = storageRef(storage, path);

    await uploadBytes(fileRef, file);

    toast.add({
      severity: "success",
      summary: t("Upload report"),
      detail: t("PDF subido correctamente"),
      group: "report"
    });
  } finally {
    uploadingPdf.value = false;
  }
};

/* ============================================================
   SESSION UTILS
============================================================ */
const goToSession = () => {
  const id = sessionsStore.selectedSession?.SessionId;
  if (id) router.push(`/session/${id}`);
};

const formatDate = (ts: number) =>
  ts ? dayjs.unix(ts).format("DD/MM/YYYY HH:mm:ss") : "";

const getDuration = () => {
  const s = sessionsStore.selectedSession;
  if (!s) return "";
  const diff = s.SessionEndTime * 1000 - s.SessionStartTime * 1000;
  const dur = dayjs.duration(diff);
  return `${String(Math.floor(dur.asHours())).padStart(2, "0")}:${String(
    dur.minutes()
  ).padStart(2, "0")}:${String(dur.seconds()).padStart(2, "0")}`;
};

const showOptionalElements = computed(
  () => !!usersStore.isAdmin || !!isProfessional.value
);

const hasOxymetryData = computed(() => {
  const s = sessionsStore.selectedSession;
  if (!s?.SessionOxAverage || Number(s.SessionOxAverage) === 0) return false;
  if (s.SessionOxCT90 === "100" && s.SessionOxCT80 === "100") return false;
  if (s.SessionOxCT90 === "1" && s.SessionOxCT80 === "1") return false;
  return true;
});

const hasMovementData = computed(
  () => !!sessionsStore.selectedSession?.SessionPLMIndex
);

const sessionError = computed(() => {
  const s = sessionsStore.selectedSession;
  if (!s) return null;
  if (s.SessionIsValid === 0) return t("Invalid Session");
  return null;
});

/* ============================================================
   AI REPORT MODAL
============================================================ */
const AIReportDialog = defineAsyncComponent(() =>
  import("../components/Summary/AIReportDialog.vue")
);

const openAIReportDialog = () => {
  dialog.open(AIReportDialog, {
    props: { header: t("ai-generated-repport"), modal: true }
  });
};
</script>

<template>
  <div v-if="sessionsStore.selectedSession">
    <Toast group="report" position="top-right" />

    <TabView>

      <!-- TAB 1 -->
      <TabPanel :header="t('SleepWise Summary')">

        <SummaryTab
          :sessionError="sessionError ?? undefined"
          :showOptionalElements="!!showOptionalElements"
          :hasOxymetryData="hasOxymetryData"
          :hasMovementData="hasMovementData"
          :notesLoaded="notesLoaded"
          :savingNotes="savingNotes"
          v-model:notes="notes"
          @saveNotes="saveNotes"
          @goToSession="goToSession"
        >
          <template #sessionHeader>
            <section class="flex justify-content-between">

              <span>
                <h2 class="text-primary text-3xl m-0">
                  {{ t("Session") }} #{{ sessionsStore.selectedSession.SessionId }}
                </h2>

                <h3 class="m-0">
                  {{ t("Start") }}:
                  {{ formatDate(sessionsStore.selectedSession.SessionStartTime) }}
                </h3>

                <h3 class="m-0">
                  {{ t("End") }}:
                  {{ formatDate(sessionsStore.selectedSession.SessionEndTime) }}
                </h3>

                <h3 class="m-0">
                  {{ t("Strenght") }}:
                  {{ sessionsStore.selectedSession.SessionMovementSignalAverage }}
                </h3>

                <h3 class="m-0">
                  {{ t("Duration") }}:
                  {{ getDuration() }}
                </h3>
              </span>

              <span v-if="!!showOptionalElements">
                <Button
                  :label="t('Download report')"
                  icon="pi pi-download"
                  class="border-round-3xl"
                  @click="downloadReport"
                />
              </span>

            </section>
          </template>
        </SummaryTab>

      </TabPanel>

      <!-- TAB 2 -->
      <TabPanel
        v-if="!!showOptionalElements"
        :header="t('Clinical info')"
      >
        <ClinicalTab :sessionId="sessionsStore.selectedSession.SessionId" />
      </TabPanel>

      <!-- TAB 3 -->
      <TabPanel
        v-if="!!showOptionalElements"
        :header="t('Documentos & IA')"
      >
        <!-- input file oculto -->
        <input
          ref="pdfInput"
          type="file"
          accept="application/pdf"
          style="display:none"
          @change="onPdfSelected"
        />

        <DocumentsTab
          :uploadingPdf="uploadingPdf"
          @triggerPdfSelect="triggerPdfSelect"
        />

        <AISection
          :userId="sessionsStore.selectedSession.userId ?? usersStore.userId"
          :deviceId="sessionsStore.selectedSession.DeviceId"
          :sessionId="sessionsStore.selectedSession.SessionId"
          :language="locale"
        />

      </TabPanel>

    </TabView>
  </div>
</template>

<style>
/* Tus estilos originales tal cual */
</style>
