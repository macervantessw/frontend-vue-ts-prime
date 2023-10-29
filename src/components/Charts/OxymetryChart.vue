<template>
  <div ref="chartContainer" class="lw-chart"></div>
</template>

<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, defineExpose, defineProps, PropType } from "vue";
import { IChartApi, ISeriesApi, UTCTimestamp, createChart } from "lightweight-charts";
import { useChartsStore } from "../../store";
import { getData } from "../../utilities/file.utilities";
import { SIGNALS, CHART_OPTIONS, LINE_OPTIONS } from "../../constants";
import JSZip from "jszip";

const chartsStore = useChartsStore();
const props = defineProps({
  files: {
    type: Object as PropType<Record<string, JSZip.JSZipObject>>,
    required: true,
  },
});

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
    getData(props.files, chartsStore.timeAxis, SIGNALS.BREATH_RATE).then((data) => {
      const serie = chart?.addLineSeries({ ...LINE_OPTIONS, color: "#ffb703" });
      serie?.setData(data as any);
      series?.push(serie as ISeriesApi<"Line">);
    });
    getData(props.files, chartsStore.timeAxis, SIGNALS.OXIMETRY).then((data) => {
      const serie = chart?.addLineSeries({ ...LINE_OPTIONS, color: "#0077b6" });
      serie?.setData(data as any);
      series?.push(serie as ISeriesApi<"Line">);
    });
    getData(props.files, chartsStore.timeAxis, SIGNALS.HR).then((data) => {
      const serie = chart?.addLineSeries({ ...LINE_OPTIONS, color: "#80b918" });
      serie?.setData(data as any);
      series?.push(serie as ISeriesApi<"Line">);
      chart?.timeScale().setVisibleRange({
        from: chartsStore.timeAxis[0] as UTCTimestamp,
        to: (chartsStore.timeAxis[0] + 10 * 60 * 1000) as UTCTimestamp,
      });
    });
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
