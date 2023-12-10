<script lang="ts" setup>
import { ref, onBeforeMount } from "vue";
import { useSessionsStore } from "../../store";
import { storeToRefs } from "pinia";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";
import VueApexCharts from "vue3-apexcharts";
import { ApexOptions } from "apexcharts";

dayjs.extend(duration);
dayjs.extend(relativeTime);

const sessionsStore = useSessionsStore();
const { selectedSession } = storeToRefs(sessionsStore);
const otherTime = ref(0);

const series = ref([] as number[]);

onBeforeMount(() => {
  series.value = setSeries();
});
const chartOptions: ApexOptions = {
  dataLabels: {
    enabled: false,
  },
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
            show: false,
          },
          value: {
            show: true,
            fontSize: "25px",
            fontFamily: "Helvetica, Arial, sans-serif",
            fontWeight: 900,
          },
          total: {
            show: true,
            formatter: function (w) {
              const totals = w.globals.seriesTotals;
              const percentage = ((totals[0] / (totals[0] + totals[1] + totals[2])) * 100).toFixed(1);
              return percentage + "%";
            },
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

const setSeries = () => {
  const sleepTime = selectedSession.value?.SessionSleepTime;
  const totalTime = selectedSession.value?.SessionDuration;
  const awakeTime = selectedSession.value?.SessionAwakeTime;

  if (totalTime !== undefined && sleepTime !== undefined && awakeTime !== undefined) otherTime.value = totalTime - sleepTime - awakeTime;

  return [(sleepTime || 0) / 60, (awakeTime || 0) / 60, otherTime.value / 60];
};

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
        <span class="text-3xl" style="font-weight: 900; color: #f3a658">{{ getMinutes(otherTime) }} min</span>
      </div>
    </div>
  </div>
</template>
<style></style>
