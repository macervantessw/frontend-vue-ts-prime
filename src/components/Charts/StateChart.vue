<template>
  <div ref="chartContainer" class="lw-chart"></div>
</template>

<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, defineExpose, PropType } from "vue";
import { IChartApi, ISeriesApi, LineData, UTCTimestamp, createChart } from "lightweight-charts";
import { useChartsStore } from "../../store";
import { CHART_OPTIONS, LINE_OPTIONS, SIGNALS } from "../../constants";
import { Event, Serie } from "../../interfaces";
import { showStateEvents } from "../../utilities/chart.utilities";

const chartsStore = useChartsStore();
let series: Serie<"Line">[] = [];
let chart: IChartApi | null = null;

const chartContainer = ref();
const props = defineProps({
  stateEvents: {
    type: Object as PropType<Event[]> | undefined,
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

// Auto resizes the chart when the browser window is resized.
const resizeHandler = () => {
  if (!chart || !chartContainer.value) return;
  const dimensions = chartContainer.value.getBoundingClientRect();
  chart.resize(dimensions.width, dimensions.height);
};

onMounted(() => {
  chart = createChart(chartContainer.value, CHART_OPTIONS);
});

onUnmounted(() => {
  if (chart) {
    chart.remove();
    chart = null;
  }
  if (series) {
    series = [];
  }
  window.removeEventListener("resize", resizeHandler);
});

watch(
  () => chartsStore.timeAxis,
  () => {
    const timeSeries = chartsStore.timeAxis.map((item) => {
      return { time: item, value: 0 } as LineData;
    });
    const serie = chart?.addLineSeries({ ...LINE_OPTIONS, color: "#80b918" });
    serie?.setData(timeSeries);
    series?.push({ name: SIGNALS.STATE, serie: serie as ISeriesApi<"Line">, id: SIGNALS.STATE });
    chart?.timeScale().setVisibleRange({
      from: chartsStore.timeAxis[0] as UTCTimestamp,
      to: (chartsStore.timeAxis[0] + 10 * 60 * 1000) as UTCTimestamp,
    });

    if (serie) showStateEvents(chart, serie, timeSeries, props.stateEvents, 20, 30);
  },
);

// watch(
//   () => chartsStore.selection.range,
//   (newVal) => {
//     if (!newVal || !chart || !chart.timeScale()) return;
//     chart.timeScale().setVisibleLogicalRange(newVal);
//   },
//   { deep: true },
// );
</script>

<style scoped>
.lw-chart {
  height: 100%;
}
</style>
