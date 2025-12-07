<template>
  <div class="mt-5">
    <h2>Asistente IA</h2>

    <!-- Botón -->
    <button
      class="mt-3 ai-btn"
      :disabled="loading"
      @click="generarInformeIA"
    >
      <span v-if="!loading">🧠 Generar análisis con IA</span>
      <span v-else>⏳ Generando informe...</span>
    </button>

    <!-- Error -->
    <div v-if="error" class="mt-3 ai-error">
      {{ error }}
    </div>

    <!-- Informe renderizado bonito -->
    <div v-if="report" class="mt-4 ai-report">
      <h3 class="ai-main-title">
        Informe clínico generado por IA
      </h3>

      <!-- HTML generado a partir del pseudo-markdown -->
      <div class="ai-markdown" v-html="htmlReport"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import axios from "axios";

// IDs recibidos desde el padre
const props = defineProps({
  userId: { type: String, required: true },
  deviceId: { type: String, required: true },
  sessionId: { type: String, required: true },
  language: { type: String, required: true }
});

const loading = ref(false);
const report = ref(null);
const error = ref(null);

/**
 * Parser muy simple de markdown:
 * - #### Título -> <h4>
 * - ###  Título -> <h3>
 * - ##   Título -> <h2>
 * - #    Título -> <h1>
 * - **negrita** -> <strong>
 * - --- / *** / ___ -> <hr>
 */
const htmlReport = computed(() => {
  if (!report.value) return "";

  // 1) Escapar HTML básico
  let text = report.value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // 2) Títulos markdown (de más niveles a menos para no solapar)
  text = text.replace(/^#### (.*)$/gm, "<h4>$1</h4>");
  text = text.replace(/^### (.*)$/gm, "<h3>$1</h3>");
  text = text.replace(/^## (.*)$/gm, "<h2>$1</h2>");
  text = text.replace(/^# (.*)$/gm, "<h1>$1</h1>");

  // 3) Separadores tipo '---', '***', '___' -> <hr>
  text = text.replace(/^\s*[-_*]{3,}\s*$/gm, '<hr class="ai-separator"/>');

  // 4) Negrita
  text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // 5) Convertir bloques en <p>, respetando títulos y hr
  const paragraphs = text
    .split(/\n\s*\n/)
    .map(block => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      if (/^<h[1-4]>/.test(trimmed)) return trimmed;
      if (/^<hr\b/.test(trimmed)) return trimmed;
      return `<p>${trimmed.replace(/\n/g, "<br/>")}</p>`;
    })
    .filter(Boolean);

  return paragraphs.join("\n");
});

// Llamada al backend
const generarInformeIA = async () => {
  console.log("🔥 Click IA - función ejecutada");

  loading.value = true;
  error.value = null;

  console.log("📤 Enviando a backend:", {
    userId: props.userId,
    deviceId: props.deviceId,
    sessionId: props.sessionId
  });

  try {
    const response = await axios.post(
      "http://localhost:4000/ai-clinical-report",
      {
        userId: props.userId,
        deviceId: props.deviceId,
        sessionId: props.sessionId,
        language: props.language
      },
      {
        timeout: 90000 // hasta 90s por si OpenAI se entretiene
      }
    );

    report.value = response.data.report;
  } catch (err) {
    console.error("❌ Error IA:", err);

    if (err?.code === "ECONNABORTED") {
      error.value =
        "El análisis está tardando más de lo habitual. Puede que el informe se genere más tarde en el servidor.";
    } else if (err?.response?.data?.error) {
      error.value = err.response.data.error;
    } else {
      error.value = "No se pudo generar el informe.";
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
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

.ai-error {
  color: #b91c1c;
  font-weight: 500;
}

.ai-main-title {
  margin: 0 0 1rem 0;
  font-size: 1.3rem;
  font-weight: 700;
  color: #111827;
}

.ai-report {
  background: #f9fafb;
  border-radius: 12px;
  padding: 1.2rem 1.4rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

/* Estilos markdown */
.ai-markdown h1,
.ai-markdown h2,
.ai-markdown h3,
.ai-markdown h4 {
  margin: 1rem 0 0.4rem 0;
  font-weight: 700;
  color: #1f2937;
}

.ai-markdown h1 {
  font-size: 1.4rem;
}
.ai-markdown h2 {
  font-size: 1.3rem;
}
.ai-markdown h3 {
  font-size: 1.2rem;
}
.ai-markdown h4 {
  font-size: 1.1rem;
}

.ai-markdown p {
  margin: 0.3rem 0;
  line-height: 1.6;
  color: #374151;
}

.ai-markdown strong {
  font-weight: 700;
  color: #111827;
}

.ai-separator {
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 1rem 0;
}
</style>
