<template>
  <div class="mt-5">
    <h2>{{ t("ai-assistant") }}</h2>

    <!-- GENERAR -->
    <button
      class="mt-3 ai-btn"
      :disabled="loading"
      @click="generarInformeIA"
    >
      <span v-if="!loading">🧠 {{ t("generate-ai-analysis") }}</span>
      <span v-else>⏳ {{ t("generating-report") }}</span>
    </button>

    <!-- ERROR -->
    <div v-if="error" class="mt-3 ai-error">
      {{ error }}
    </div>

    <!-- EDITOR + PREVIEW -->
    <div v-if="reportEditable" class="mt-4 ai-report">
      <h3 class="ai-main-title">{{ t("ai-generated-report") }}</h3>

      <!-- EDITOR -->
      <textarea
        v-model="reportEditable"
        class="ai-editor"
        rows="10"
      ></textarea>

      <!-- PREVIEW BONITA -->
      <div class="ai-preview" v-html="htmlReport"></div>

      <!-- BOTONES -->
      <div class="mt-3 flex gap-2">
        <button
          class="ai-btn-secondary"
          :disabled="saving"
          @click="guardar"
        >
          💾 {{ saving ? t("saving-report") : t("save-report") }}
        </button>

        <button class="ai-btn-secondary" @click="exportarPDF">
          📄 {{ t("export-pdf") }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import axios from "axios";
import { useI18n } from "vue-i18n";
import { getDatabase, ref as dbRef, get, set } from "firebase/database";
import { useSessionsStore } from "../../store";
import { useUsersStore } from "../../store";

const { t } = useI18n();
const sessionsStore = useSessionsStore();
const usersStore = useUsersStore();

const props = defineProps<{
  userId: string;
  deviceId: string;
  sessionId: string;
  language: string;
}>();

/* =========================
   STATE
========================= */
const loading = ref(false);
const saving = ref(false);
const reportEditable = ref("");
const error = ref<string | null>(null);

const db = getDatabase();

/* =========================
   PATH REAL — NO TOCAMOS TU LÓGICA
========================= */
const getReportPath = () => {
  const userId = sessionsStore.selectedSession?.userId; // ✅ LO DEJAMOS TAL CUAL ESTABA FUNCIONANDO
  const sessionId = sessionsStore.selectedSession?.SessionId;
  const deviceId = sessionsStore.selectedSession?.DeviceId;

  if (!userId || !sessionId || !deviceId) return null;

  return `users/${userId}/Sessions/${deviceId}\\${sessionId}\\/AIReport`;
};

/* =========================
   CARGAR DESDE FIREBASE
========================= */
const cargarDesdeFirebase = async () => {
  const path = getReportPath();
  if (!path) return;

  try {
    console.log("🔎 AI REPORT LOAD PATH:", path);
    const snap = await get(dbRef(db, path));
    if (snap.exists()) {
      reportEditable.value = snap.val()?.report || "";
    }
  } catch (e) {
    console.error("Error cargando AIReport:", e);
  }
};

onMounted(cargarDesdeFirebase);

watch(
  () => sessionsStore.selectedSession,
  () => {
    reportEditable.value = "";
    cargarDesdeFirebase();
  }
);

/* =========================
   GENERAR CON IA — IGUAL QUE ANTES
========================= */
const generarInformeIA = async () => {
  loading.value = true;
  error.value = null;

  try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

      const { data } = await axios.post(
        `${apiBaseUrl}/ai-clinical-report`,
        {
          userId: props.userId,
          deviceId: props.deviceId,
          sessionId: props.sessionId,
          language: props.language
        },
        { timeout: 90000 }
      );

        reportEditable.value = data.report || "";
  }catch (err: any) {
    console.error("Error IA:", err);

    if (err?.code === "ECONNABORTED") {
      error.value = t("error-timeout");
    } else if (err?.response?.data?.error) {
      error.value = err.response.data.error;
    } else {
      error.value = t("error-generic");
    }
  } finally {
    loading.value = false;
  }
};

/* =========================
   GUARDAR MANUAL — IGUAL QUE ANTES
========================= */
const guardar = async () => {
  if (!reportEditable.value.trim()) return;

  const path = getReportPath();
  if (!path) return;

  saving.value = true;
  error.value = null;

  try {
    console.log("🔥 AI REPORT SAVE PATH:", path);
    await set(dbRef(db, path), {
      report: reportEditable.value,
      updatedAt: Date.now()
    });

    alert(t("saved-success"));
  } catch (e) {
    console.error("Error guardando reporte:", e);
    error.value = t("error-saving");
  } finally {
    saving.value = false;
  }
};

/* =========================
   PREVIEW BONITA (NUEVO)
========================= */
const htmlReport = computed(() => {
  if (!reportEditable.value) return "";

  let text = reportEditable.value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Títulos
  text = text.replace(/^#### (.*)$/gm, "<h4>$1</h4>");
  text = text.replace(/^### (.*)$/gm, "<h3>$1</h3>");
  text = text.replace(/^## (.*)$/gm, "<h2>$1</h2>");
  text = text.replace(/^# (.*)$/gm, "<h1>$1</h1>");

  // Separadores
  text = text.replace(/^\s*[-_*]{3,}\s*$/gm, "<hr/>");

  // Negrita
  text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // Párrafos
  const blocks = text
    .split(/\n\s*\n/)
    .map(b => {
      const t = b.trim();
      if (!t) return "";
      if (/^<h[1-4]>/.test(t)) return t;
      if (/^<hr/.test(t)) return t;
      return `<p>${t.replace(/\n/g, "<br/>")}</p>`;
    })
    .filter(Boolean);

  return blocks.join("\n");
});

/* =========================
   EXPORTAR PDF — CON PAGINADO (ARREGLADO)
========================= */
const exportarPDF = async () => {
  // Carga dinámica para no inflar el bundle inicial
  const html2pdfModule = await import("html2pdf.js");
  const html2pdf = (html2pdfModule.default || html2pdfModule) as any;

  // Usamos directamente la preview bonita
  const element = document.querySelector(".ai-preview") as HTMLElement | null;
  if (!element) return;

  // Opciones de html2pdf
  const opt = {
    // A4 con márgenes en mm (arriba, derecha, abajo, izquierda)
    margin: [15, 15, 15, 15] as [number, number, number, number],
    filename: `reporte-${props.sessionId}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: {
      scale: 2,       // Más resolución
      useCORS: true
    },
    jsPDF: {
      unit: "mm",
      format: "a4",
      orientation: "portrait"
    },
    pagebreak: {
      // Usa reglas CSS + modo legacy
      mode: ["css", "legacy"],
      // Intenta NO cortar dentro de estos elementos/bloques
      avoid: [".no-break", "h1", "h2", "h3", "h4"]
    }
  };

  html2pdf().set(opt).from(element).save();
};



</script>

<style scoped>
.ai-editor {
  width: 100%;
  margin-top: 1rem;
  border-radius: 8px;
  padding: 1rem;
  font-family: monospace;
  min-height: 220px;
  border: 1px solid #d1d5db;
}

.ai-preview {
  margin-top: 1rem;
  background: #f9fafb;
  border-radius: 12px;
  padding: 1.5rem;
  line-height: 1.65;
}

.ai-preview h1,
.ai-preview h2,
.ai-preview h3,
.ai-preview h4 {
  margin-top: 1rem;
  color: #1f2937;
}

.ai-preview p {
  margin: 0.4rem 0;
  color: #374151;
}

.ai-preview strong {
  color: #111827;
}

.ai-btn {
  cursor: pointer;
  font-weight: 600;
  border: none;
  background: #3b82f6;
  color: white;
  border-radius: 999px;
  padding: 0.6rem 1.4rem;
}

.ai-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.ai-btn-secondary {
  cursor: pointer;
  background: #10b981;
  color: white;
  padding: 0.5rem 1.3rem;
  border-radius: 999px;
  border: none;
}

.ai-error {
  color: #b91c1c;
  font-weight: 500;
  margin-top: 0.75rem;
}

.ai-report {
  background: #f9fafb;
  border-radius: 12px;
  padding: 1.2rem 1.4rem;
  margin-top: 1rem;
}
</style>
