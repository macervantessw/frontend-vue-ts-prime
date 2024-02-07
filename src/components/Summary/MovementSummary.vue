<script lang="ts" setup>
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

    labels: [t("plm-index")],
  };
});
</script>
<template>
  <SummaryCard :title="$t('movement-analysis')">
    <div class="w-full flex justify-content-center mb-5">
      <VueApexCharts height="312px" type="radialBar" :options="chartOptions" :series="series"></VueApexCharts>
    </div>
    <PLMLegendBar :plm="PLMIndex" />
    <div class="flex justify-content-between pt-6 sm:pt-2 px-3 h-full align-items-end">
      <div class="flex flex-1 flex-column align-items-center">
        <span class="text-lg overflow-hidden">{{ $t("plm-index") }}</span>
        <span class="text-3xl" style="font-weight: 900">{{ Number(selectedSession?.SessionPLMIndex).toFixed(2) }}</span>
      </div>

      <div class="flex flex-1 flex-column align-items-center">
        <span class="text-lg">{{ $t("Total") }}</span>
        <span class="text-3xl" style="font-weight: 900">{{ Number(selectedSession?.SessionNumPLMEvents).toFixed(0) }}</span>
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
