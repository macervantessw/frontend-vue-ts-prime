<script lang="ts" setup>
import Chart from "primevue/chart";

import { ref, onMounted } from "vue";
import { useSessionsStore } from "../../store";
import { storeToRefs } from "pinia";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(duration);
dayjs.extend(relativeTime);

const sessionsStore = useSessionsStore();
const { selectedSession } = storeToRefs(sessionsStore);
const otherTime = ref(0);

onMounted(() => {
  chartData.value = setChartData();
  chartOptions.value = setChartOptions();
});

const chartData = ref();
const chartOptions = ref();

const setChartData = () => {
  // const documentStyle = getComputedStyle(document.body);
  const sleepTime = selectedSession.value?.SessionSleepTime;
  const totalTime = selectedSession.value?.SessionDuration;
  const awakeTime = selectedSession.value?.SessionAwakeTime;

  if (totalTime !== undefined && sleepTime !== undefined && awakeTime !== undefined) otherTime.value = totalTime - sleepTime - awakeTime;

  return {
    datasets: [
      {
        data: [sleepTime, awakeTime, otherTime.value],
        backgroundColor: ["#5586f3", "#68b0a7", "#f3a658"],
        hoverBackgroundColor: ["hsl(221, 87%, 70%)", "hsl(173, 31%, 65%)", "hsl(30, 87%, 72%)"],
      },
    ],
  };
};

const setChartOptions = () => {
  const documentStyle = getComputedStyle(document.documentElement);
  const textColor = documentStyle.getPropertyValue("--text-color");

  return {
    plugins: {
      legend: {
        labels: {
          cutout: "70%",
          color: textColor,
        },
      },
    },
  };
};

const getMinutes = (time: number | undefined) => {
  if (time === undefined) return 0;
  return dayjs.duration(time, "seconds").asMinutes().toFixed(0);
};
</script>
<template>
  <div>
    <h2 class="mt-0 font-bold text-3xl text-primary">{{ $t("Sleep eficiency") }}</h2>
    <div class="w-full flex justify-content-center">
      <Chart type="doughnut" :data="chartData" :options="chartOptions" class="w-7" />
    </div>
    <div class="flex justify-content-between mt-4 px-3">
      <div class="flex flex-column align-items-center">
        <span class="text-sm">{{ $t("Sleep Time") }}</span>
        <span class="text-2xl font-bold" style="color: #5586f3">{{ getMinutes(selectedSession?.SessionSleepTime) }} min </span>
      </div>
      <div class="flex flex-column align-items-center">
        <span class="text-sm">{{ $t("Awake time") }}</span>
        <span class="text-2xl font-bold" style="color: #68b0a7">{{ getMinutes(selectedSession?.SessionAwakeTime) }} min </span>
      </div>
      <div class="flex flex-column align-items-center">
        <span class="text-sm">{{ $t("Others") }}</span>
        <span class="text-2xl font-bold" style="color: #f3a658">{{ getMinutes(otherTime) }} min</span>
      </div>
    </div>
  </div>
</template>
<style></style>
