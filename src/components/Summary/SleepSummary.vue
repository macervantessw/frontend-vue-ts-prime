<script lang="ts" setup>
import { computed } from "vue";
import { useSessionsStore } from "../../store";
import { storeToRefs } from "pinia";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";
import VueApexCharts from "vue3-apexcharts";
import { ApexOptions } from "apexcharts";
import i18n from "../../i18n";

dayjs.extend(duration);
dayjs.extend(relativeTime);

const { t } = i18n.global;
const sessionsStore = useSessionsStore();
const { selectedSession } = storeToRefs(sessionsStore);

// const series = ref([] as number[]);

// onBeforeMount(() => {
//   series.value = setSeries();
// });
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
</script>
<template>
  <div>
    <h2 class="mt-0 font-bold text-3xl text-primary">{{ $t("Sleep eficiency") }}</h2>
    <div class="w-full flex justify-content-center py-5">
      <VueApexCharts type="donut" :options="chartOptions" :series="series"></VueApexCharts>
    </div>
    <div class="flex justify-content-between mt-4 px-3">
      <div class="flex flex-column align-items-center">
        <span class="text-lg">{{ $t("Sleep Time") }}</span>
        <span class="text-3xl" style="font-weight: 900; color: #5586f3">{{ getMinutes(selectedSession?.SessionSleepTime) }} min </span>
      </div>
      <div class="flex flex-column align-items-center">
        <span class="text-lg">{{ $t("Awake time") }}</span>
        <span class="text-3xl" style="font-weight: 900; color: #68b0a7">{{ getMinutes(selectedSession?.SessionAwakeTime) }} min </span>
      </div>
      <div class="flex flex-column align-items-center">
        <span class="text-lg">{{ $t("Others") }}</span>
        <span class="text-3xl" style="font-weight: 900; color: #f3a658">{{ getMinutes(series[2] * 60) }} min</span>
      </div>
    </div>
  </div>
</template>
<style></style>
