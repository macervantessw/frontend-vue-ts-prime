<template>
  <div>
    <div ref="chartContainer" class="lw-chart absolute w-full" :class="{ 'opacity-0': !chartsStore.allRendered }"></div>
    <Skeleton v-if="!chartsStore.allRendered" class="w-full h-full absolute"></Skeleton>
  </div>
</template>

<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, defineExpose, PropType } from "vue";
import { IChartApi, ISeriesApi, LineData, MouseEventParams, UTCTimestamp, createChart } from "lightweight-charts";
import { useChartsStore } from "../../store";
import { CHART_OPTIONS, LINE_OPTIONS, SIGNALS, VISIBLE_MINUTES } from "../../constants";
import { Event, Serie } from "../../interfaces";
import { showStateEvents } from "../../utilities/chart.utilities";
import Skeleton from "primevue/skeleton";

const chartsStore = useChartsStore();
let series: Serie<"Line">[] = [];
let chart: IChartApi | null = null;

const chartContainer = ref();
const props = defineProps({
  stateEvents: {
    type: Object as PropType<Event[] | undefined>,
    required: true,
  },
});

const getChart = () => {
  return chart;
};
const getSeries = () => {
  return series;
};

defineExpose({ getSeries, getChart });

onMounted(() => {
  chart = createChart(chartContainer.value, CHART_OPTIONS);
  chart.subscribeClick((param: MouseEventParams) => {
    chartsStore.setCurrentTime(param.time as number);
  });
});

onUnmounted(() => {
  if (chart) {
    chart.remove();
    chart = null;
  }
  if (series) {
    series = [];
  }
});

watch(
  () => chartsStore.timeAxis,
  () => {
    const timeSeries = chartsStore.timeAxis.map((item) => {
      return { time: item, value: 0 } as LineData;
    });
    const serie = chart?.addLineSeries({ ...LINE_OPTIONS, color: "#80b918" });
    serie?.setData(timeSeries);
    console.log("State has been rendered");
    chartsStore.stateChartRendered = true;
    series?.push({ name: SIGNALS.STATE, serie: serie as ISeriesApi<"Line">, id: SIGNALS.STATE });
    chart?.timeScale().setVisibleRange({
      from: chartsStore.timeAxis[0] as UTCTimestamp,
      to: (chartsStore.timeAxis[0] + VISIBLE_MINUTES * 60 * 1000) as UTCTimestamp,
    });

    if (serie) showStateEvents(chart, serie, timeSeries, props.stateEvents, 10, 20);
  },
);
</script>

<style scoped>
.lw-chart {
  height: 100%;
}
</style>
