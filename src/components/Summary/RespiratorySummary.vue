<script lang="ts" setup>
import { computed } from "vue";
import { storeToRefs } from "pinia";
import VueApexCharts from "vue3-apexcharts";
import { useSessionsStore } from "../../store";
import SummaryCard from "./SummaryCard.vue";
import RespiratoryLegendBar from "./RespiratoryLegendBar.vue";

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
  <SummaryCard :title="$t('respiratory-analysis')">
    <div class="w-full flex justify-content-center mb-5">
      <VueApexCharts height="312px" type="radialBar" :options="chartOptions" :series="series"></VueApexCharts>
    </div>
    <RespiratoryLegendBar :iah="iah" />
    <div class="flex justify-content-between pt-6 sm:pt-2 px-3 h-full align-items-end">
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
  border-right: 4px solid #4745f9;
}
.progress-top {
  background-color: #ffffff00;
}
</style>
<style lang="scss">
@supports (-webkit-touch-callout: none) {
  svg {
    path.apexcharts-radialbar-area {
      filter: none;
    }
  }
}
svg {
  path.apexcharts-radialbar-area {
    stroke-width: 32px;
  }
}
</style>
