<template>
  <div ref="chartContainer" class="lw-chart"></div>
</template>

<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, defineExpose } from "vue";
import { IChartApi, ISeriesApi, MouseEventParams, Time, createChart } from "lightweight-charts";
import { useChartsStore } from "../../store";
import { CHART_OPTIONS, LINE_OPTIONS } from "../../constants";
import { cloneDeep } from "lodash";
import { VertLine } from "./plugins/vertical-line";

const chartsStore = useChartsStore();
const vertline = ref(null as VertLine | null);
// Lightweight Charts™ instances are stored as normal JS variables
// If you need to use a ref then it is recommended that you use `shallowRef` instead
let series: ISeriesApi<"Line">[] = [];
let chart: IChartApi | null = null;

const chartContainer = ref();

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

  chart = createChart(chartContainer.value, chartOptions);
  chart.subscribeClick((param: MouseEventParams) => {
    if (!param.point) return;
    chartsStore.selection = {
      x: param.point.x,
      y: param.point.y,
      time: param.time as Time,
    };
    if (chart) {
      if (vertline.value) series[0].detachPrimitive(vertline.value);
      vertline.value = new VertLine(chart, series[0], param.time as Time, {
        showLabel: false,
        color: "hsla(0, 79.70%, 44.50%, 0.44)",
        width: 40,
      });
      series[0].attachPrimitive(vertline.value);
      series[0].setMarkers([
        {
          time: param.time as Time,
          position: "inBar",
          shape: "circle",
          color: "hsla(0, 79.70%, 44.50%, 0.01)",
          size: 1,
        },
      ]);
      vertline.value.updateAllViews();
    }
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
      return { time: item, value: 0 };
    });
    const serie = chart?.addLineSeries({ ...LINE_OPTIONS, color: "#80b918" });
    serie?.setData(timeSeries as any);
    series?.push(serie as ISeriesApi<"Line">);
    chart?.timeScale().fitContent();
  },
);
</script>

<style scoped>
.lw-chart {
  height: 100%;
}
</style>
