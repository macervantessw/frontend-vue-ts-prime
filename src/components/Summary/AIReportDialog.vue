<script lang="ts" setup>
import OpenAI from "openai";
import { computed, ref } from "vue";
import { useSessionsStore } from "../../store";
// import Button from "primevue/button";

const sessionsStore = useSessionsStore();

const apiKey = "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"
const openai = new OpenAI({ apiKey: apiKey, dangerouslyAllowBrowser: true });
const result = ref("");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stream = ref<any>(null);

const prompt = computed(() => {
  if (!sessionsStore.selectedSession) return "";
  const eficency = (sessionsStore.selectedSession?.SessionSleepTime / sessionsStore.selectedSession?.SessionDuration) * 100;
  const snoringsPerHour = sessionsStore.selectedSession?.SessionNumSnorings / (sessionsStore.selectedSession?.SessionDuration / 3600);
  /*const prompt = `Quiero que me escribas un informe sobre los datos de un estudio de sueño dividido en tres partes bien diferenciadas. La primera se titula "Analisis de Sueño" y se analizaran 5 variables que te proporcionare. Las dos primeras variables son la eficiencia del sueño y la latencia del sueño. Utiliza tu conocimiento para dar una explicación sobre los resultados de estas dos varibles.La tercera variable es el indice de microdespertares por hora. Esta variable se considerará se considera normal por debajo de 7 y se considerará alta conforme se acerque al valor de 10. Si supera el valor de 10 diremos explicitamente que el sueño está excesivamente fragmentado. Tambien te proporcionaré el tiempo total de sueño y el tiempo despierto. Si el cociente entre tiempo despierto y el tiempo total de sueño es mayor de 0.1 diremos que existe una alteración en la proporcion de sueño que deberiamos vigilar.
La segunda se titula "Análisis respiratorio". Te proporcionare un valor de IAH donde se consideraran los siguientes márgenes. De 0-5 normal, de 5-15 leve, de 15-30 moderado y >30 severo. En caso de un IAH moderado se recomendara una visita al medico y solamente caso de severo se recomendara encarecidamente una visita al medico. El tercer análisis es respecto al ronquido. Se proporcionara un numero medio de ronquidos por hora. Utiliza tu criterio para dar información al respecto.
Me gustaría que no dieras una importancia excesiva al ronquido, ya que no se considera una patología en si misma, aunque si un indicio de patología en caso de ser excesivo.
Me gustaría que el informe tuviera aproximadamente 300 palabras. Al final del informe se ha de incluir una serie de recomendaciones generales (como evitar el consumo de alcohol antes de dormir, evitar uso de pantallas etc) y también especificas en función de los datos proporcionados. Evita la mención de terapias especificas como CPAP. Evita también aconsejar visitas a médicos en caso de que los parámetros entren dentro de la normalidad. El informe debes redactarlo en ${lang()}.
Los datos son: Latencia = ${sessionsStore.selectedSession?.SessionSleepLatency / 60} minutos 
Eficiencia = ${eficency}%
Microdespertares por hora = ${sessionsStore.selectedSession?.SessionMicroAwakeIndex}
Tiempo dormido = ${sessionsStore.selectedSession?.SessionSleepTime / 60} minutos
Tiempo despierto = ${sessionsStore.selectedSession?.SessionAccountableAwakeTime / 60} minutos
IAH = ${sessionsStore.selectedSession?.SessionIAH}
Número de ronquidos/hora = ${snoringsPerHour}`;*/


const prompt = `Quiero que redactes un informe médico sobre los datos de un estudio de sueño. Este informe debe redactarse en idioma ${lang()} y dividirse en tres secciones diferenciadas cuyo titulo ha de ir en una fuente mas grande y subrayada y contar con aproximadamente 300 palabras. A continuación, detallo las instrucciones para cada sección:

1. **Análisis de Sueño**:
   - Se analizarán cinco variables: eficiencia del sueño, latencia del sueño, índice de microdespertares, tiempo total de sueño y tiempo despierto.
   - **Eficiencia del sueño**: Indica qué tan eficiente fue el descanso. Si la eficiencia es:
     - >=90%: buena.
     - Entre 80% y 90%: ligeramente baja.
     - <80%: deficiente. Describe los resultados con base en estos rangos.
   - **Latencia del sueño**: Tiempo en minutos que tarda en iniciar el sueño. Proporciona una breve explicación sobre este valor.
   - Respecto a los microdespertares haz una descripcion según tu criterio.

2. **Análisis Respiratorio**:
   - Proporciona el valor de IAH (índice de apnea-hipopnea). Interpreta los resultados según estos márgenes:
     - 0-5: normal.
     - 5-15: leve.
     - 15-30: moderado. Recomienda una visita al médico.
     - >30: severo. Recomienda encarecidamente visitar al médico.
   - Solo menciona recomendaciones si el valor lo justifica.

3. **Análisis de Ronquido**:
   - Incluye el número promedio de ronquidos por hora. Proporciona información general sobre el ronquido, destacando que no es una patología en sí misma pero puede ser un indicio si es excesivo. No le des demasiada importancia salvo que sea un caso extremo.

Al final del informe, incluye recomendaciones generales (evitar el alcohol antes de dormir, uso de pantallas, etc.) y específicas según los datos proporcionados. Evita mencionar terapias concretas como CPAP y no sugieras visitas médicas si los parámetros están dentro de la normalidad.

Datos del estudio:
- Latencia del sueño: ${sessionsStore.selectedSession?.SessionSleepLatency / 60} minutos
- Eficiencia del sueño: ${eficency}%
- Microdespertares por hora: ${sessionsStore.selectedSession?.SessionMicroAwakeIndex}
- Tiempo dormido: ${sessionsStore.selectedSession?.SessionSleepTime / 60} minutos
- Tiempo despierto: ${sessionsStore.selectedSession?.SessionAccountableAwakeTime / 60} minutos
- IAH: ${sessionsStore.selectedSession?.SessionIAH}
- Ronquidos/hora: ${snoringsPerHour}`;


  console.log(prompt);

  return prompt;
});

const lang = () => {
  if (sessionsStore.selectedSession?.Lang === "es") return "español";
  else if (sessionsStore.selectedSession?.Lang === "it") return "italiano";
  else return "inglés";
};
const getResponse = async () => {
  if (!prompt.value) return;
  console.log(prompt.value);

  stream.value = openai.chat.completions.create({
    //model: "gpt-3.5-turbo",
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
  <div class="p-2 sm:p-4">
    <!-- <Button icon="pi pi-stop-circle" text rounded @click="stream.controller.abort()" /> -->
    <section class="p-4">
      <p class="text-xl font-semibold" v-html="result.replace(/\n/g, '<br>')"></p>
    </section>
  </div>
</template>
<style scoped lang="scss">
@import url("https://fonts.googleapis.com/css2?family=Indie+Flower&display=swap");
$gradient: ();

// Generate multiple black/white linear gradients

$line-height: 40px;

@media (min-width: 576px) {
  .paper {
    .content {
      padding: 30px 30px 30px 80px;
      &:after {
        left: 50px;
      }
    }
  }
}
.paper {
  margin: 0 auto;
  border-left: 30px solid white;
  border-radius: 0 20px 20px 0;
  border-image: url("../../assets/paper-border.svg") 5% 100% repeat;
  border-image-width: 0px 0px 0px 30px;
  transform: translateY(100%);
  animation: init 1s ease-in-out forwards;

  .content {
    position: relative;
    margin: 0;
    padding: 30px 30px 30px 22px !important;
    border: none;
    border-radius: 0 20px 20px 0;
    font-family: "Indie Flower", cursive;

    background: #fcf9f4 linear-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 0) 0 20px / 100% $line-height;

    &:after {
      position: absolute;
      top: 0;
      left: 12px;
      content: "";
      height: 100%;
      width: 1px;
      border-left: double #e08183;
    }
  }

  p {
    margin: 0 0 $line-height 0;
    color: #333;
  }

  span {
    position: relative;
    line-height: $line-height;
  }
}

.form__field {
  display: inline;
  color: #7db665;
  outline: none;

  &:empty {
    display: inline-block;
    color: #ddd;
  }

  // Use a data-attr to replicate a placeholder
  &:empty,
  &:empty:focus {
    &:before {
      content: attr(data-placeholder);
    }
  }
}

// Hide blur defs
svg {
  display: none;
}

@keyframes init {
  75% {
    transform: translateY(-20px);
  }
  100% {
    transform: translateY(0);
  }
}

@keyframes do-blur {
  0% {
    filter: url(#blur4);
  }

  25% {
    filter: url(#blur3);
  }

  50% {
    filter: url(#blur2);
  }

  75% {
    filter: url(#blur1);
  }

  100% {
    filter: url(#blur0);
  }
}
svg {
  filter: drop-shadow(3px 5px 2px rgb(0 0 0 / 0.4));
}
</style>
