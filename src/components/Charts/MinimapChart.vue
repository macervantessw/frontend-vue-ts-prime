<template>
  <div>
    <div ref="chartContainer" class="lw-chart absolute w-full" :class="{ 'opacity-0': !chartsStore.allRendered }"></div>
    <Skeleton v-if="!chartsStore.allRendered" class="w-full h-full absolute"></Skeleton>
  </div>
</template>

<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, defineExpose, PropType } from "vue";
import { IChartApi, ISeriesApi, LineData, MouseEventParams, Range, Time, UTCTimestamp, createChart } from "lightweight-charts";
import { useChartsStore } from "../../store";
import { CHART_OPTIONS, LINE_OPTIONS, VISIBLE_HALF, VISIBLE_MINUTES } from "../../constants";
import { cloneDeep } from "lodash";
import { Event } from "../../interfaces";
import { showRespiratoryEvents, showSnoringEvents, showStateEvents } from "../../utilities/chart.utilities";
import { Box } from "./plugins/box";
import Skeleton from "primevue/skeleton";

const chartsStore = useChartsStore();
const timeSeries = ref([] as LineData[]);
const box = ref(null as Box | null);
let series: ISeriesApi<"Line">[] = [];
let chart: IChartApi | null = null;

const chartContainer = ref();
const props = defineProps({
  stateEvents: {
    type: Object as PropType<Event[] | undefined>,
    required: true,
  },
  respiratoryEvents: {
    type: Object as PropType<Event[] | undefined>,
    required: true,
  },
  snoringEvents: {
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

defineExpose({ getSeries, getChart, drawBox });

// Auto resizes the chart when the browser window is resized.
const resizeHandler = () => {
  if (!chart || !chartContainer.value) return;
  chart.timeScale().fitContent();
  const dimensions = chartContainer.value.getBoundingClientRect();
  chart.resize(dimensions.width, dimensions.height, true);
  chart.timeScale().setVisibleRange({
    from: chartsStore.timeAxis[0] as UTCTimestamp,
    to: chartsStore.timeAxis[chartsStore.timeAxis.length - 1] as UTCTimestamp,
  });
  setSelectionBox(chartsStore.timeAxis[0] as UTCTimestamp);
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
    if (!param.point || !param.time) return;
    setSelectionBox(param.time);
  });

  window.addEventListener("resize", resizeHandler);
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
    timeSeries.value = chartsStore.timeAxis.map((item) => {
      return { time: item, value: 0 } as LineData;
    });
    const serie = chart?.addLineSeries({ ...LINE_OPTIONS, color: "#80b918" });
    serie?.setData(timeSeries.value);
    console.log("MinimapChart has been rendered");
    chartsStore.minimapChartRendered = true;
    series?.push(serie as ISeriesApi<"Line">);
    chart?.timeScale().fitContent();

    showRespiratoryEvents(chart, series[0], timeSeries.value, props.respiratoryEvents, 30, 20, false);
    showStateEvents(chart, series[0], timeSeries.value, props.stateEvents, undefined, 15);
    showSnoringEvents(chart, series[0], timeSeries.value, props.snoringEvents, 50, 20);
  },
);

function setSelectionBox(time: Time) {
  let from = Number(time) - VISIBLE_HALF * 60 * 1000;
  let to = Number(time) + VISIBLE_HALF * 60 * 1000;
  if (from < chartsStore.timeAxis[0]) {
    from = chartsStore.timeAxis[0];
    to = from + VISIBLE_MINUTES * 60 * 1000;
  } else if (to > chartsStore.timeAxis[chartsStore.timeAxis.length - 1]) {
    to = chartsStore.timeAxis[chartsStore.timeAxis.length - 1];
    from = to - VISIBLE_MINUTES * 60 * 1000;
  }
  chartsStore.selection = {
    range: { from: from as Time, to: to as Time },
  };
  drawBox({ from: from as Time, to: to as Time });
}

function drawBox(timeRange: Range<Time>) {
  if (box.value) series[0].detachPrimitive(box.value);
  if (!chart || !timeSeries.value.length) return;
  box.value = new Box(chart, series[0], timeSeries.value, timeRange.from, timeRange.to, 0, undefined, {
    showLabel: false,
    color: "hsla(180, 4.00%, 44.10%, 0.60)",
    width: 40,
  });
  series[0].attachPrimitive(box.value);
  series[0].setMarkers([
    {
      time: timeRange.from,
      position: "inBar",
      shape: "circle",
      color: "hsla(0, 79.70%, 44.50%, 0.01)",
      size: 1,
    },
  ]);
  box.value.updateAllViews();
}
</script>

<style scoped>
.lw-chart {
  height: 100%;
}
</style>
