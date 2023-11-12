<template>
  <div ref="chartContainer" class="lw-chart"></div>
</template>

<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, defineExpose, PropType } from "vue";
import { IChartApi, ISeriesApi, LineData, MouseEventParams, Time, UTCTimestamp, createChart } from "lightweight-charts";
import { useChartsStore } from "../../store";
import { CHART_OPTIONS, LINE_OPTIONS } from "../../constants";
import { cloneDeep } from "lodash";
import { Event } from "../../interfaces";
import { showStateEvents } from "../../utilities/chart.utilities";

const chartsStore = useChartsStore();
let series: ISeriesApi<"Line">[] = [];
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
  // Create the Lightweight Charts Instance using the container ref.
  const chartOptions = cloneDeep(CHART_OPTIONS);
  if (chartOptions.timeScale) {
    chartOptions.timeScale.barSpacing = 0.002;
    chartOptions.timeScale.minBarSpacing = 0.002;
  }
  if (chartOptions.handleScroll) {
    chartOptions.handleScroll = { mouseWheel: false, pressedMouseMove: false };
  }
  chart = createChart(chartContainer.value, chartOptions);

  chart.subscribeClick((param: MouseEventParams) => {
    if (!param.point) return;
    chartsStore.selection = {
      x: param.point.x,
      y: param.point.y,
      time: param.time as Time,
    };
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
    series?.push(serie as ISeriesApi<"Line">);
    chart?.timeScale().setVisibleRange({
      from: chartsStore.timeAxis[0] as UTCTimestamp,
      to: (chartsStore.timeAxis[0] + 10 * 60 * 1000) as UTCTimestamp,
    });
    showStateEvents(chart, series[0], timeSeries, props.stateEvents, 20, 30);
  },
);

watch(
  () => chartsStore.selection,
  (newVal) => {
    chart?.timeScale().setVisibleRange({
      from: (Number(newVal.time) - 5 * 60 * 1000) as UTCTimestamp,
      to: (Number(newVal.time) + 5 * 60 * 1000) as UTCTimestamp,
    });
  },
  { deep: true },
);
</script>

<style scoped>
.lw-chart {
  height: 100%;
}
</style>
