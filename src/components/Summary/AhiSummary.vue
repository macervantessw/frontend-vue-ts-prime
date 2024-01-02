<script lang="ts" setup>
import { computed } from "vue";
import { storeToRefs } from "pinia";
import VueApexCharts from "vue3-apexcharts";
import { useSessionsStore } from "../../store";
import ProgressBar from "primevue/progressbar";
import SummaryCard from "./SummaryCard.vue";

const sessionsStore = useSessionsStore();
const { selectedSession } = storeToRefs(sessionsStore);
const iah = computed(() => Number(selectedSession.value?.SessionIAH || 0));
const series = computed(() => [iah.value / 0.6]);

const getColor = computed(() => {
  if (iah.value <= 5) {
    return ["#68b0a7"];
  } else if (iah.value > 5 && iah.value < 15) {
    return ["#AEAB80"];
  } else if (iah.value >= 15 && iah.value < 30) {
    return ["#F3A658"];
  } else if (iah.value >= 30 && iah.value < 60) {
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

    labels: ["Events/h"],
  };
});
</script>
<template>
  <SummaryCard title="AHI">
    <div class="w-full flex justify-content-center">
      <VueApexCharts height="312px" type="radialBar" :options="chartOptions" :series="series"></VueApexCharts>
    </div>
    <div class="flex align-items-center justify-content-center relative h-full">
      <div class="flex text-sm w-full mt-3 pl-1 absolute z-5 text-white">
        <div class="flex justify-content-center" style="width: 8%">0-5</div>
        <div class="flex justify-content-center border-left-1" style="width: 16%">5-15</div>
        <div class="flex justify-content-center border-left-1" style="width: 25%">15-30</div>
        <div class="flex justify-content-center border-left-1" style="width: 51%">30-60</div>
      </div>
      <ProgressBar
        :value="100"
        :show-value="false"
        class="progress-bottom absolute w-full h-2rem mt-4"
        :pt="{
          value: {
            style: {
              background:
                'linear-gradient(90deg, rgba(104,176,167,1) 0%, rgba(174,171,128,1) 10%, rgba(243,166,88,1) 25%, rgba(197,89,50,1) 50%, rgba(151,12,12,1) 70%, rgb(55, 7, 7) 100%)',
            },
          },
        }"
      />
      <ProgressBar :value="iah / 0.6" :show-value="false" class="progress-top absolute w-full h-2rem mt-4" />
    </div>
    <div class="flex justify-content-between mt-4 px-3">
      <div class="flex flex-1 flex-column align-items-center">
        <span class="text-lg overflow-hidden">Apnea/Hipoap.</span>
        <span class="text-3xl" style="font-weight: 900; color: #5586f3">{{ selectedSession?.SessionNumRespEvents }}</span>
      </div>
      <div class="flex flex-1 flex-column align-items-center">
        <span class="text-lg">{{ $t("Central") }}</span>
        <span class="text-3xl" style="font-weight: 900; color: #68b0a7">{{ selectedSession?.SessionCentralApneas }}</span>
      </div>
      <div class="flex flex-1 flex-column align-items-center">
        <span class="text-lg">{{ $t("Total") }}</span>
        <span class="text-3xl" style="font-weight: 900; color: #f3a658">{{
          selectedSession?.SessionCentralApneas || 0 + (selectedSession?.SessionNumRespEvents || 0)
        }}</span>
      </div>
    </div>
  </SummaryCard>
</template>
<style>
.progress-top .p-progressbar-value {
  background-color: #ffffff00;
  border-right: 4px solid #3d3afe;
}
.progress-top {
  background-color: #ffffff00;
}
</style>
