<script lang="ts" setup>
import { ref } from "vue";
import { computed } from "vue";
import { storeToRefs } from "pinia";
import VueApexCharts from "vue3-apexcharts";
import { useSessionsStore } from "../../store";
import SummaryCard from "./SummaryCard.vue";
import PLMLegendBar from "./PLMLegendBar.vue";
import i18n from "../../i18n";

const { t } = i18n.global;
const sessionsStore = useSessionsStore();
const { selectedSession } = storeToRefs(sessionsStore);
const PLMIndex = computed(() => Number(selectedSession.value?.SessionPLMIndex || 0));
const series = computed(() => [PLMIndex.value / 0.6]);

const getColor = computed(() => {
  if (PLMIndex.value <= 5) {
    return ["#68b0a7"];
  } else if (PLMIndex.value > 5 && PLMIndex.value < 15) {
    return ["#AEAB80"];
  } else if (PLMIndex.value >= 15 && PLMIndex.value < 30) {
    return ["#F3A658"];
  } else if (PLMIndex.value >= 30 && PLMIndex.value < 60) {
    return ["#970c0c"];
  } else {
    return ["#5e0808"];
  }
});
const chartOptions = computed(() => {
  return {
    plotOptions: {
      radialBar: {
        startAngle: -135,
        endAngle: 135,
        hollow: {
          size: "55%",
        },
        track: {
          background: "#DDD",
          dropShadow: {
            enabled: true,
            top: 2,
            left: 0,
            blur: 4,
            opacity: 0.15,
          },
        },
        dataLabels: {
          show: true,
          name: {
            offsetY: -10,
            show: true,
            color: "#333",
            fontSize: "20px",
          },
          value: {
            formatter: function (val: string) {
              return (Number(val) * 0.6).toFixed(2);
            },
            offsetY: 5,
            fontSize: "25px",
            fontFamily: "Helvetica, Arial, sans-serif",
            fontWeight: 900,
            show: true,
          },
        },
      },
    },
    fill: {
      colors: getColor.value,
    },
    stroke: {
      lineCap: "butt",
    },
    labels: [t("PLM/h")],
  };
});

// Estado del tooltip
const showTooltip = ref(false);

const toggleTooltip = () => {
  showTooltip.value = !showTooltip.value;
};
</script>

<template>
  <SummaryCard :title="$t('movement-analysis')">
    <!-- Botón de información en la esquina superior derecha -->
    <div class="absolute top-0 right-0 p-3">
      <button
        class="info-button"
        @click="toggleTooltip"
        aria-label="Información"
      >
        <i class="pi pi-info-circle text-2xl"></i>
      </button>
      <!-- Tooltip -->
      <div
        v-if="showTooltip"
        class="tooltip-content"
      >
        <p>Periodic limb movements (PLMs) are involuntary movements of the limbs during sleep. They may disrupt sleep quality and are measured by the PLM Index (PLMI), indicating frequency per hour.</p>
        <a href="https://www.sleepwa.com.au/interpreting-a-sleep-study/" target="_blank" rel="noopener noreferrer">
          Learn more...
        </a>
      </div>
    </div>

    <!-- Contenido principal -->
    <div class="w-full flex justify-content-center mb-5">
      <VueApexCharts
        height="312px"
        type="radialBar"
        :options="chartOptions"
        :series="series"
      ></VueApexCharts>
    </div>
    <PLMLegendBar :plm="PLMIndex" />
    <div class="flex justify-content-between pt-6 sm:pt-2 px-3 h-full align-items-end">
      <div class="flex flex-1 flex-column align-items-center">
        <span class="text-lg overflow-hidden">{{ $t("PLM Index") }}</span>
        <span class="text-3xl" style="font-weight: 900; color: #5586f3">
          {{ Number(selectedSession?.SessionPLMIndex).toFixed(2) }}
        </span>
      </div>
      <div class="flex flex-1 flex-column align-items-center">
        <span class="text-lg">{{ $t("Total") }}</span>
        <span class="text-3xl" style="font-weight: 900; color: #f3a658">
          {{ Number(selectedSession?.SessionNumPLMEvents).toFixed(0) }}
        </span>
      </div>
    </div>
  </SummaryCard>
</template>

<style>
/* Estilo del botón de información */
.info-button {
  background: none;
  border: none;
  cursor: pointer;
  outline: none;
  color: inherit;
}

/* Estilo del tooltip */
.tooltip-content {
  position: absolute;
  top: 100%;
  right: 0;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 5px;
  padding: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 10;
  width: 200px;
  text-align: left;
}

.tooltip-content p {
  margin: 0 0 5px;
}

.tooltip-content a {
  color: #007bff;
  text-decoration: none;
}

.tooltip-content a:hover {
  text-decoration: underline;
}
</style>
