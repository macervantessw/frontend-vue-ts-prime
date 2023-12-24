<script lang="ts" setup>
import { computed } from "vue";
import { storeToRefs } from "pinia";
import VueApexCharts from "vue3-apexcharts";
import { useSessionsStore } from "../../store";

const sessionsStore = useSessionsStore();
const { selectedSession } = storeToRefs(sessionsStore);
const series = computed(() => [Number(selectedSession.value?.SessionIAH || 0) * 2]);

const getColor = computed(() => {
  const iah = Number(selectedSession.value?.SessionIAH || 0);
  if (iah < 10) {
    return ["#68b0a7"];
  } else if (iah >= 10 && iah < 20) {
    return ["#f3a658"];
  } else {
    return ["#f36868"];
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
              return (Number(val) / 2).toFixed(2);
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

    labels: ["Events/h"],
  };
});
</script>
<template>
  <div>
    <h2 class="mt-0 mb-1 font-bold text-3xl text-primary">AHI</h2>
    <div class="w-full flex justify-content-center">
      <VueApexCharts height="312px" type="radialBar" :options="chartOptions" :series="series"></VueApexCharts>
    </div>
    <div class="flex justify-content-between mt-4 px-3">
      <div class="flex flex-column align-items-center">
        <span class="text-lg">Apnea/Hipoap.</span>
        <span class="text-3xl" style="font-weight: 900; color: #5586f3">{{ selectedSession?.SessionNumRespEvents }}</span>
      </div>
      <div class="flex flex-column align-items-center">
        <span class="text-lg">{{ $t("Central") }}</span>
        <span class="text-3xl" style="font-weight: 900; color: #68b0a7">{{ selectedSession?.SessionCentralApneas }}</span>
      </div>
      <div class="flex flex-column align-items-center">
        <span class="text-lg">{{ $t("Total") }}</span>
        <span class="text-3xl" style="font-weight: 900; color: #f3a658">{{
          selectedSession?.SessionCentralApneas || 0 + (selectedSession?.SessionNumRespEvents || 0)
        }}</span>
      </div>
    </div>
  </div>
</template>
<style></style>
