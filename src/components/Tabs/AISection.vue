<template>
  <div class="mt-5">
    <h2>{{ t('ai-assistant') }}</h2>

    <!-- Botón -->
    <button
      class="mt-3 ai-btn"
      :disabled="loading"
      @click="generarInformeIA"
    >
      <span v-if="!loading">🧠 {{ t('generate-ai-analysis') }}</span>
      <span v-else>⏳ {{ t('generating-report') }}</span>
    </button>

    <!-- Error -->
    <div v-if="error" class="mt-3 ai-error">
      {{ error }}
    </div>

    <!-- Informe renderizado bonito -->
    <div v-if="report" class="mt-4 ai-report">
      <h3 class="ai-main-title">
        {{ t('ai-generated-report') }}
      </h3>

      <div class="ai-markdown" v-html="htmlReport"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import axios from "axios";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps({
  userId: { type: String, required: true },
  deviceId: { type: String, required: true },
  sessionId: { type: String, required: true },
  language: { type: String, required: true }
});

const loading = ref(false);
const report = ref(null);
const error = ref(null);

/* Parser markdown → HTML */
const htmlReport = computed(() => {
  if (!report.value) return "";

  let text = report.value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  text = text.replace(/^#### (.*)$/gm, "<h4>$1</h4>");
  text = text.replace(/^### (.*)$/gm, "<h3>$1</h3>");
  text = text.replace(/^## (.*)$/gm, "<h2>$1</h2>");
  text = text.replace(/^# (.*)$/gm, "<h1>$1</h1>");

  text = text.replace(/^\s*[-_*]{3,}\s*$/gm, '<hr class="ai-separator"/>');
  text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  return text
    .split(/\n\s*\n/)
    .map(block => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      if (/^<h[1-4]>/.test(trimmed)) return trimmed;
      if (/^<hr\b/.test(trimmed)) return trimmed;
      return `<p>${trimmed.replace(/\n/g, "<br/>")}</p>`;
    })
    .filter(Boolean)
    .join("\n");
});

/* Llamada al backend */
const generarInformeIA = async () => {
  loading.value = true;
  error.value = null;

  try {
    const response = await axios.post(
      "http://localhost:4000/ai-clinical-report",
      {
        userId: props.userId,
        deviceId: props.deviceId,
        sessionId: props.sessionId,
        language: props.language
      },
      { timeout: 90000 }
    );

    report.value = response.data.report;

  } catch (err) {
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
</script>
