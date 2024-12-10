<script lang="ts" setup>
import OpenAI from "openai";
import { computed, ref } from "vue";
import { useSessionsStore } from "../../store";

const sessionsStore = useSessionsStore();

const apiKey = "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"; // Reemplaza con tu clave de API de OpenAI
const openai = new OpenAI({ apiKey: apiKey, dangerouslyAllowBrowser: true });
const result = ref("");
const stream = ref<any>(null);

const lang = () => {
  if (sessionsStore.selectedSession?.Lang === "es") return "español";
  else if (sessionsStore.selectedSession?.Lang === "it") return "italiano";
  else return "inglés";
};

const prompt = computed(() => {
  if (!sessionsStore.selectedSession) return "";
  const eficency = (sessionsStore.selectedSession?.SessionSleepTime / sessionsStore.selectedSession?.SessionDuration) * 100;
  const snoringsPerHour = sessionsStore.selectedSession?.SessionNumSnorings / (sessionsStore.selectedSession?.SessionDuration / 3600);

  return `
  Quiero que generes un informe médico con formato HTML sobre un estudio de sueño. El informe debe ser docente en cuanto a conceptos y ocupar unas 300 palabras. Ha de estar dividido en tres secciones con títulos claros y contenido estructurado. Cada sección debe tener subtítulos si es necesario. El idioma del informe es ${lang()}. Aquí están los detalles:

  - **Análisis de Sueño**:
    - Analiza las siguientes variables segun tu conocimiento. Para el eficiencia, recuerda que Si la eficiencia es >=90% la consideraremos buena, si está entre 80% y 90% será ligeramente y si es <80% se considera deficiente. Describe los resultados con base en estos rangos.
      - Eficiencia del sueño: ${eficency}%
      - Latencia del sueño: ${(sessionsStore.selectedSession?.SessionSleepLatency / 60).toFixed(1)} minutos
      - Microdespertares por hora: ${sessionsStore.selectedSession?.SessionMicroAwakeIndex}
      - Tiempo total dormido: ${(sessionsStore.selectedSession?.SessionSleepTime / 60).toFixed(1)} minutos
      - Tiempo despierto: ${(sessionsStore.selectedSession?.SessionAccountableAwakeTime / 60).toFixed(1)} minutos

  - **Análisis Respiratorio**:
    - Índice de Apnea-Hipopnea (IAH): ${sessionsStore.selectedSession?.SessionIAH}

  - **Análisis de Ronquido**:
    - Número promedio de ronquidos por hora: ${snoringsPerHour.toFixed(1)}

  No des una importancia excesiva al ronquido, ya que no se considera una patología en si misma, aunque si un indicio de patología en caso de ser excesivo  
  Al final del informe, incluye recomendaciones generales (como evitar el alcohol antes de dormir, limitar el uso de pantallas etc) y recomendaciones específicas basadas en los datos proporcionados. Evita la mención de terapias especificas como CPAP. Aconseja una visita al medico si el IAH > 5 y modula la urgencia segun este valor.
  Recuerda al final del informe que éste ha sido generado por una IA y no substitye la opinión de un médico.

  Devuelve el informe en el siguiente formato HTML:
  <h1>Análisis de Sueño</h1>
  <p>Describir las variables con interpretaciones claras.</p>
  <h1>Análisis Respiratorio</h1>
  <p>Interpretar los resultados de IAH.</p>
  <h1>Análisis de Ronquido</h1>
  <p>Describe los ronquidos y su impacto, si aplica.</p>
  <h2>Recomendaciones</h2>
  <ul>
    <li>Recomendación general 1</li>
    <li>Recomendación general 2</li>
  </ul>
  `;
});

const getResponse = async () => {
  if (!prompt.value) return;

  stream.value = openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt.value }],
    stream: true,
  });
  result.value = ""; // Limpiar resultado antes de empezar
  for await (const chunk of await stream.value) {
    result.value += chunk.choices[0]?.delta?.content || "";
  }
};

getResponse();
</script>

<template>
  <div class="p-4">
    <section v-if="result" class="report" v-html="result"></section>
    <section v-else>
      <p>Loading report...</p>
    </section>
  </div>
</template>

<style scoped>
.report {
  font-family: Arial, sans-serif;
  line-height: 1.6;
}

.report h1 {
  font-size: 1.8rem;
  font-weight: bold;
  border-bottom: 2px solid #ccc;
  margin-bottom: 0.5rem;
}

.report p {
  margin-bottom: 1rem;
}

.report ul {
  list-style-type: disc;
  margin-left: 1.5rem;
}

.report li {
  margin-bottom: 0.5rem;
}
</style>
