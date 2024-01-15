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
  <div class="p-2 sm:p-4">
    <!-- <Button icon="pi pi-stop-circle" text rounded @click="stream.controller.abort()" /> -->
    <section class="paper shadow-3">
      <p class="text-xl font-semibold content" v-html="result.replace(/\n/g, '<br>')"></p>
    </section>
  </div>
</template>
<style lang="scss">
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
