<template>
  <div ref="chartContainer" class="lw-chart"></div>
</template>

<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, defineExpose, defineProps, PropType } from "vue";
import { IChartApi, ISeriesApi, UTCTimestamp, createChart } from "lightweight-charts";
import { useChartsStore } from "../../store";
import { getData, getAverage } from "../../utilities/file.utilities";
import { CHART_OPTIONS, SIGNALS, LINE_OPTIONS } from "../../constants";
import JSZip from "jszip";

const average = ref(0);
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
  async () => {
    const promises: Promise<void>[] = [];
    const average = await getAverage(props.files, SIGNALS.AIR_FLOW);

    // const atenuation = 100 - (series[1][dataPointIndex] / series[0][dataPointIndex]) * 100;

    promises.push(generateLineSeries(SIGNALS.AIR_FLOW, "Air Flow", "#ffb703", average));
    promises.push(generateLineSeries(SIGNALS.BASAL_AIR_FLOW, "Basal Air Flow", "#0077b6"));
    promises.push(generateLineSeries(SIGNALS.MOVEMENT, "Movement", "#80b918"));

    Promise.all(promises).then(() => {
      chart?.timeScale().fitContent();
      chart?.timeScale().setVisibleRange({
        from: chartsStore.timeAxis[0] as UTCTimestamp,
        to: (chartsStore.timeAxis[0] + 10 * 60 * 1000) as UTCTimestamp,
      });

      series[0].priceScale().applyOptions({
        autoScale: false,
        scaleMargins: {
          top: 0.3,
          bottom: 0.2,
        },
      });
      // series[0].applyOptions({
      //   autoscaleInfoProvider: () => ({
      //     priceRange: {
      //       min: 0,
      //       max: average.value * 4,
      //     },
      //   }),
      // });
    });
  },
);

function generateLineSeries(signal: string, name: string, color: string, avg?: number): Promise<void> {
  return new Promise((resolve) => {
    getData(props.files, chartsStore.timeAxis, signal).then((data) => {
      let options = { ...LINE_OPTIONS, color: color };
      if (avg) {
        options = {
          ...options,
          autoscaleInfoProvider: () => ({
            priceRange: {
              min: 0,
              max: avg ? avg * 4 : 0,
            },
          }),
        };
      }
      const serie = chart?.addLineSeries(options);
      serie?.setData(data as any);
      series?.push(serie as ISeriesApi<"Line">);
      resolve();
    });
  });
}
</script>

<style scoped>
.lw-chart {
  height: 100%;
}
</style>
