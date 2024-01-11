<script lang="ts" setup>
import OpenAI from "openai";
import { computed, ref } from "vue";
import { useSessionsStore } from "../../store";
// import Button from "primevue/button";

const sessionsStore = useSessionsStore();
const apiKey = "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";
const openai = new OpenAI({ apiKey: apiKey, dangerouslyAllowBrowser: true });
const result = ref("");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stream = ref<any>(null);

const prompt = computed(() => {
  if (!sessionsStore.selectedSession) return "";
  const eficency = (sessionsStore.selectedSession?.SessionSleepTime / sessionsStore.selectedSession?.SessionDuration) * 100;
  const snoringsPerHour = sessionsStore.selectedSession?.SessionNumSnorings / (sessionsStore.selectedSession?.SessionDuration / 3600);
  return `Quiero que me escribas un informe sobre los datos de un estudio de sueño dividido en tres partes bien diferenciadas. La primera se titula "Analisis de Sueño" y se analizaran 5 variables que te proporcionare. Las dos primeras variables son la eficiencia del sueño y la latencia del sueño. Utiliza tu conocimiento para dar una explicación sobre los resultados de estas dos varibles.La tercera variable es el indice de microdespertares por hora. Esta variable se considerará se considera normal por debajo de 7 y se considerará alta conforme se acerque al valor de 10. Si supera el valor de 10 diremos explicitamente que el sueño está excesivamente fragmentado. Tambien te proporcionaré el tiempo total de sueño y el tiempo despierto. Si el cociente entre tiempo despierto y el tiempo total de sueño es mayor de 0.1 diremos que existe una alteración en la proporcion de sueño que deberiamos vigilar.
La segunda se titula "Análisis respiratorio". Te proporcionare un valor de IAH donde se consideraran los siguientes márgenes. De 0-5 normal, de 5-15 leve, de 15-30 moderado y >30 severo. En caso de un IAH moderado se recomendara una visita al medico y solamente caso de severo se recomendara encarecidamente una visita al medico. El tercer análisis es respecto al ronquido. Se proporcionara un numero medio de ronquidos por hora. Utiliza tu criterio para dar información al respecto.
Me gustaría que no dieras una importancia excesiva al ronquido, ya que no se considera una patología en si misma, aunque si un indicio de patología en caso de ser excesivo.
Me gustaría que el informe tuviera aproximadamente 300 palabras. Al final del informe se ha de incluir una serie de recomendaciones generales (como evitar el consumo de alcohol antes de dormir, evitar uso de pantallas etc) y también especificas en función de los datos proporcionados. Evita la mención de terapias especificas como CPAP. Evita también aconsejar visitas a médicos en caso de que los parámetros entren dentro de la normalidad. El informe debes redactarlo en inglés.
Los datos son: Latencia = ${sessionsStore.selectedSession?.SessionSleepLatency / 60} minutos 
Eficiencia = ${eficency}%
Microdespertares por hora = ${sessionsStore.selectedSession?.SessionMicroAwakeIndex}
Tiempo dormido = ${sessionsStore.selectedSession?.SessionSleepTime / 60} minutos
Tiempo despierto = ${sessionsStore.selectedSession?.SessionAccountableAwakeTime / 60} minutos
IAH = ${sessionsStore.selectedSession?.SessionIAH}
Número de ronquidos/hora = ${snoringsPerHour}`;
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
