<template>
  <div ref="chartContainer" class="lw-chart"></div>
</template>

<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, defineExpose, defineProps, PropType } from "vue";
import { DeepPartial, IChartApi, ISeriesApi, LineData, LineStyleOptions, TimeChartOptions, createChart } from "lightweight-charts";
import { useChartsStore } from "../../store";
import { getData } from "../../utilities/file.utilities";
import { SIGNALS } from "../../constants";
import JSZip from "jszip";

const lineOptions: Partial<LineStyleOptions> = {
  lineWidth: 2,
};

const chartOptions: DeepPartial<TimeChartOptions> = {
  autoSize: false,
  rightPriceScale: {
    visible: false,
  },
};
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

defineExpose({ getChart, getSeries });

// Auto resizes the chart when the browser window is resized.
const resizeHandler = () => {
  if (!chart || !chartContainer.value) return;
  const dimensions = chartContainer.value.getBoundingClientRect();
  chart.resize(dimensions.width, dimensions.height);
};

onMounted(() => {
  // Create the Lightweight Charts Instance using the container ref.
  chart = createChart(chartContainer.value, chartOptions);
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
    getData(props.files, chartsStore.timeAxis, SIGNALS.AIR_FLOW).then((data) => {
      const serie = chart?.addLineSeries({ ...lineOptions, color: "#ffb703" });
      serie?.setData(data as LineData[]);
      series?.push(serie as ISeriesApi<"Line">);
    });
    getData(props.files, chartsStore.timeAxis, SIGNALS.BASAL_AIR_FLOW).then((data) => {
      const serie = chart?.addLineSeries({ ...lineOptions, color: "#0077b6" });
      serie?.setData(data as LineData[]);
      series?.push(serie as ISeriesApi<"Line">);
    });
    getData(props.files, chartsStore.timeAxis, SIGNALS.MOVEMENT).then((data) => {
      const serie = chart?.addLineSeries({ ...lineOptions, color: "#80b918" });
      serie?.setData(data as LineData[]);
      series?.push(serie as ISeriesApi<"Line">);
    });
  },
);
</script>

<style scoped>
.lw-chart {
  height: 100%;
}
</style>
