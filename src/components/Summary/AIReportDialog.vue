<script lang="ts" setup>
import OpenAI from "openai";
import { computed, ref } from "vue";
import { useSessionsStore } from "../../store";
// import Button from "primevue/button";

const sessionsStore = useSessionsStore();
const apiKey = import.meta.env.VITE_OPENAI_APIKEY;
const openai = new OpenAI({ apiKey: apiKey, dangerouslyAllowBrowser: true });
const result = ref("");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stream = ref<any>(null);
const prompt = computed(() => {
  if (!sessionsStore.selectedSession) return "";
  const eficency = (sessionsStore.selectedSession?.SessionSleepTime / sessionsStore.selectedSession?.SessionDuration) * 100;
  const snoringsPerHour = sessionsStore.selectedSession?.SessionNumSnorings / (sessionsStore.selectedSession?.SessionDuration / 3600);
  return `Quiero que me escribas un informe sobre los datos de un estudio de sueño dividido en tres partes bien diferenciadas, dado que el texto que generes sera pareado por un sistema automático y se han de ver claramente cuando empieza cada parte. La primera parte afecta a la calidad de sueño y los valores que te proporcionare son la latencia, la eficiencia y el numero de microdespertares. Sobre la latencia y la eficiencia utiliza los criterios estándar. Respecto al numero de microdespertares, si es superior a 30, puedes hacer una sugerencia al respecto de que quizás haya habido una fragmentación de sueño excesiva.
La segunda parte del informe hace referencia al análisis respiratorio. Te proporcionare un valor de IAH donde se consideraran los siguientes márgenes. De 0-5 normal, de 5-15 leve, de 15-30 moderado y >30 severo. En caso de un IAH moderado se recomendara una visita al medico y solamente caso de severo se recomendara encarecidamente una visita al medico. El tercer análisis es respecto al ronquido. Se proporcionara un numero medio de ronquidos por hora. Utiliza tu criterio para dar información al respecto.
Me gustaría que no dieras una importancia excesiva al ronquido, ya que no se considera una patología en si misma, aunque si un indicio de patología en caso de ser excesivo.
Me gustaría que el informe tuviera aproximadamente 300 palabras. Al final del informe se ha de incluir una serie de recomendaciones generales (como evitar el consumo de alcohol antes de dormir, evitar uso de pantallas etc) y también especificas en función de los datos proporcionados. Evita la mención de terapias especificas como CPAP. Evita también aconsejar visitas a médicos en caso de que los parámetros entren dentro de la normalidad. Quiero que me escribas el report en inglés.
Los datos son: Latencia = ${sessionsStore.selectedSession?.SessionSleepLatency / 60} minutos, Eficiencia = ${eficency}%, Número de despertares = ${sessionsStore
    .selectedSession?.SessionNumAwakes}, IAH = ${sessionsStore.selectedSession
    ?.SessionIAH}, Número de ronquidos/hora = ${snoringsPerHour}. Devuelve el resultado en español`;
});

const getResponse = async () => {
  if (!prompt.value) return;
  console.log(prompt.value);

  stream.value = openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt.value }],
    stream: true,
  });
  for await (const chunk of await stream.value) {
    result.value += chunk.choices[0]?.delta?.content || "";
  }
};

getResponse();
</script>
<template>
  <div class="p-4">
    <!-- <Button icon="pi pi-stop-circle" text rounded @click="stream.controller.abort()" /> -->
    <p class="text-xl font-semibold" v-html="result.replace(/\n/g, '<br>')"></p>
  </div>
</template>
<style></style>
