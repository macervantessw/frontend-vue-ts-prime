<script lang="ts" setup>
import { ref, computed } from "vue";
import { useSessionsStore } from "../../store";
import { storeToRefs } from "pinia";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";
import VueApexCharts from "vue3-apexcharts";
import { ApexOptions } from "apexcharts";
import i18n from "../../i18n";
import SummaryCard from "./SummaryCard.vue";
import DataComponent from "../DataComponent.vue";

dayjs.extend(duration);
dayjs.extend(relativeTime);

const { t } = i18n.global;
const sessionsStore = useSessionsStore();
const { selectedSession } = storeToRefs(sessionsStore);

// Configuración del gráfico
const chartOptions: ApexOptions = {
  dataLabels: {
    enabled: false,
  },
  labels: [t("Sleep Time"), t("Awake time"), t("Others")],
  tooltip: {
    enabled: true,
    y: {
      formatter: function (val) {
        return val.toFixed(2) + " min";
      },
    },
  },
  plotOptions: {
    pie: {
      donut: {
        labels: {
          show: true,
          name: {
            show: true,
            color: "#333",
          },
          value: {
            show: true,
            fontSize: "25px",
            fontFamily: "Helvetica, Arial, sans-serif",
            fontWeight: 900,
            formatter: function (w) {
              const percentage = Number(w).toFixed(0);
              return percentage + "min";
            },
          },
          total: {
            show: true,
            formatter: function (w) {
              const totals = w.globals.seriesTotals;
              const percentage = ((totals[0] / (totals[0] + totals[1] + totals[2])) * 100).toFixed(1);
              return percentage + "%";
            },
            label: t("Total asleep"),
            fontWeight: 900,
            fontFamily: "Helvetica, Arial, sans-serif",
          },
        },
      },
    },
  },
  colors: ["#5586f3", "#68b0a7", "#f3a658"],
  legend: {
    show: false,
  },
};

const series = computed(() => {
  const sleepTime = selectedSession.value?.SessionSleepTime;
  const totalTime = selectedSession.value?.SessionDuration;
  const awakeTime = selectedSession.value?.SessionAwakeTime;

  const otherTime = totalTime !== undefined && sleepTime !== undefined && awakeTime !== undefined ? totalTime - sleepTime - awakeTime : 0;

  return [(sleepTime || 0) / 60, (awakeTime || 0) / 60, otherTime / 60];
});

const getMinutes = (time: number | undefined) => {
  if (time === undefined) return 0;
  return dayjs.duration(time, "seconds").asMinutes().toFixed(0);
};

const awakesPerHour = () => {
  const numAwakes = selectedSession.value?.SessionNumAwakes;
  const totalTime = selectedSession.value?.SessionDuration;
  if (numAwakes === undefined || totalTime === undefined) return 0;
  const totalHours = dayjs.duration(totalTime, "seconds").asHours();

  return numAwakes / totalHours;
};

// Estado del tooltip
const showTooltip = ref(false);

const toggleTooltip = () => {
  showTooltip.value = !showTooltip.value;
};
</script>

<template>
  <SummaryCard :title="t('Sleep analysis')">
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
        <p>Sleep efficiency measures the percentage of time spent asleep while in bed. A higher percentage indicates better sleep quality.</p>
        <a href="https://www.sleepwa.com.au/interpreting-a-sleep-study/" target="_blank" rel="noopener noreferrer"@click.stop>
          Learn more...
        </a>
      </div>
    </div>

    <div class="w-full flex justify-content-center py-5">
      <VueApexCharts type="donut" :options="chartOptions" :series="series"></VueApexCharts>
    </div>
    <div class="grid m-0">
      <DataComponent
        class="col-12 xl:col-6 p-0 pr-1"
        :title="$t('Sleep Time')"
        :value="getMinutes(selectedSession?.SessionSleepTime)"
        units="min"
        icon="icon-park-solid:sleep"
        color="hsl(221,70%,80%)"
      />
      <DataComponent
        class="col-12 xl:col-6 p-0 pr-1"
        :title="$t('Awake time')"
        :value="getMinutes(selectedSession?.SessionAwakeTime)"
        units="min"
        icon="mdi:eye"
        color="hsl(173,50%,80%)"
      />
      <DataComponent
        class="col-12 xl:col-6 p-0 pr-1"
        :title="$t('others-time')"
        :value="getMinutes(series[2] * 60)"
        units="min"
        icon="carbon:unknown-filled"
        color="hsl(30,60%,85%)"
      />
      <DataComponent class="col-12 xl:col-6 p-0 pr-1" :title="$t('Num. Awakes')" :value="selectedSession?.SessionNumAwakes" icon="octicon:number-16" />
      <DataComponent class="col-12 xl:col-6 p-0 pr-1" :title="$t('Awakes per hour')" :value="awakesPerHour().toFixed(2)" icon="ion:time" />
      <DataComponent
        class="col-12 xl:col-6 p-0 pr-1"
        :title="$t('sleep-latency')"
        :value="selectedSession?.SessionSleepLatency ? Number(selectedSession?.SessionSleepLatency) / 60 : '-'"
        units="min"
        icon="material-symbols:start"
      />
      <DataComponent
        class="col-12 xl:col-8 p-0 pr-1"
        :title="$t('Micro awakes per hour')"
        :value="selectedSession?.SessionMicroAwakeIndex ? Number(selectedSession?.SessionMicroAwakeIndex).toFixed(2) : '-'"
        icon="ion:time"
      />
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
