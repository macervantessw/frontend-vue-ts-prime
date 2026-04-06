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
import { useChartsStore, useSessionsStore } from "../../store";
import { CHART_OPTIONS, LINE_OPTIONS, RESPIRATORY_EVENTS, VISIBLE_HALF, VISIBLE_MINUTES } from "../../constants";
import { cloneDeep } from "lodash";
import { Event } from "../../interfaces";
import { drawBox, drawStateEvent, removeBox, showOxymetryEvents, showRespiratoryEvents, showSnoringEvents, showStateEvents } from "../../utilities/chart.utilities";
import { Box } from "./plugins/box";
import Skeleton from "primevue/skeleton";

const chartsStore = useChartsStore();
const sessionsStore = useSessionsStore();
const timeSeries = ref([] as LineData[]);
let selectionBox: Box | undefined = undefined;
let oxymetryEventBoxes: Box[] | undefined = [];
let addedEventBoxes: Box[] = [];
let series: ISeriesApi<"Line">[] = [];
let chart: IChartApi | null = null;
let oldEvents: Event[] = [];

let stateEventBoxes: Box[] = [];
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

defineExpose({ getSeries, getChart, drawSelectionBox });

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
  if (chartOptions.handleScale) {
    chartOptions.handleScale = { mouseWheel: false, axisPressedMouseMove: false };
  }
  chart = createChart(chartContainer.value, chartOptions);

  chart.subscribeClick((param: MouseEventParams) => {
    if (!param.point || !param.time) return;
    chartsStore.setCurrentTime(param.time as UTCTimestamp);
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

function setSelectionBox(time: Time) {
  let from = Number(time) - VISIBLE_HALF * 60 * 1000;
  let to = Number(time) + VISIBLE_HALF * 60 * 1000;
  if (chartsStore.selection.range?.from && chartsStore.selection.range?.to) {
    const diff = Number(chartsStore.selection.range.to) - Number(chartsStore.selection.range.from);
    from = Number(time) - diff / 2;
    to = Number(time) + diff / 2;
  }

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
  removeBox(selectionBox, series[0]);
  selectionBox = drawBox(chart, from as Time, to as Time, series[0], "hsla(180, 4%, 44%, 0.50)");
}

function drawSelectionBox(timeRange: Range<Time>) {
  removeBox(selectionBox, series[0]);
  selectionBox = drawBox(chart, timeRange.from, timeRange.to, series[0], "hsla(180, 4%, 44%, 0.50)");

  if (selectionBox) series[0].detachPrimitive(selectionBox);
  if (!chart || !timeSeries.value.length) return;
  selectionBox = new Box(chart, series[0], timeSeries.value, timeRange.from, timeRange.to, 0, undefined, {
    showLabel: false,
    color: "hsla(180, 4%, 44%, 0.50)",
    width: 40,
  });
  series[0].attachPrimitive(selectionBox);
  series[0].setMarkers([
    {
      time: timeRange.from,
      position: "inBar",
      shape: "circle",
      color: "hsla(0, 79.70%, 44.50%, 0.01)",
      size: 1,
    },
  ]);
  selectionBox.updateAllViews();
}

watch(
  () => chartsStore.timeAxis,
  () => {
    timeSeries.value = chartsStore.timeAxis.map((item) => {
      return { time: item, value: 0 } as LineData;
    });
    const serie = chart?.addLineSeries({ ...LINE_OPTIONS, color: "#80b918" });
    serie?.setData(timeSeries.value);
    // console.log("MinimapChart has been rendered");
    chartsStore.minimapChartRendered = true;
    series?.push(serie as ISeriesApi<"Line">);
    chart?.timeScale().fitContent();
    addedEventBoxes = showRespiratoryEvents(
      chart,
      series[0],
      timeSeries.value,
      props.respiratoryEvents,
      40 /* verticalOffset */,
      10 /* height */,
      false /* showDiscarded */,
      true /* solidColor */,
    ) as Box[];

    stateEventBoxes = showStateEvents(chart, series[0], timeSeries.value, props.stateEvents, undefined, 10) || [];
    oldEvents = JSON.parse(JSON.stringify(props.stateEvents)); // Create a deep copy of props.stateEvents
    showSnoringEvents(chart, series[0], timeSeries.value, props.snoringEvents, 50, 10);
  },
);

function findBox(event: Event) {
  return addedEventBoxes.find((b) => b._time === event.startTime * 1000 && b._end === event.endTime * 1000);
}
function removeFromAddedEvents(event: Event) {
  addedEventBoxes = addedEventBoxes.filter((b) => b._time !== event.startTime * 1000 && b._end !== event.endTime * 1000);
}

function drawEvent(event: Event) {
  const from = (event.startTime * 1000) as Time;
  const to = (event.endTime * 1000) as Time;
  const eventType = Number(event.eventType);
  let color = "hsla(207, 73%, 39%, 1)";
  if (eventType === RESPIRATORY_EVENTS.DISCARDABLE_ISOLATED) color = "hsla(54, 97%, 56%, 1)";
  else if (eventType === RESPIRATORY_EVENTS.EVENT_TYPE_CENTRAL_APNEA) color = "hsl(24, 76%, 51%,1)";
  const serie = series[0];
  const box = drawBox(chart, from, to, serie, color, "", 40, 10);
  if (box) addedEventBoxes.push(box);
}
watch(
  () => chartsStore.oxymetryEvents,
  (events) => {
    oxymetryEventBoxes = showOxymetryEvents(chart, series[0], timeSeries.value, events, oxymetryEventBoxes, 30, 10, "hsla(30, 87%, 65%, 1)");
  },
  { deep: true },
);

watch(
  () => chartsStore.respiratoryEvents,
  (events) => {
    if (events.length) {
      const event = events[0];
      chartsStore.respiratoryEvents = [];
      const box = findBox(event);
      const serie = series[0];
      removeBox(box, serie);
      removeFromAddedEvents(event);
      const eventType = Number(event.eventType);
      if (eventType !== RESPIRATORY_EVENTS.DISCARDABLE_AWAKE && eventType !== RESPIRATORY_EVENTS.DISCARDABLE_ISOLATED) drawEvent(event);
    }
  },
  { deep: true },
);

watch(
  () => sessionsStore.selectedSession?.Data.StateEvents,
  (newEvents) => {
    if (newEvents && newEvents.length) {
      const oldSet = new Set(oldEvents.map((e) => JSON.stringify(e)));
      const newSet = new Set(newEvents.map((e) => JSON.stringify(e)));

      const addedEvents = newEvents.filter((newEvent) => !oldSet.has(JSON.stringify(newEvent)));
      const removedEvents = oldEvents.filter((oldEvent) => !newSet.has(JSON.stringify(oldEvent)));

      addedEvents.forEach(addStateEvent);

      removedEvents.forEach((oldEvent) => {
        const box = stateEventBoxes.find((b) => b._time === oldEvent.startTime * 1000 && b._end === oldEvent.endTime * 1000);
        removeBox(box, series[0]);
        stateEventBoxes = stateEventBoxes.filter((b) => !(b._time === oldEvent.startTime * 1000 && b._end === oldEvent.endTime * 1000));
      });

      oldEvents = JSON.parse(JSON.stringify(newEvents)); // Create a deep copy of newEvents
    }

    // if (newEvents && newEvents.length) {
    //   const old: Event[] = JSON.parse(JSON.stringify(oldEvents));
    //   newEvents.forEach((newEvent) => {
    //     const found = old.find((oldEvent) => oldEvent.startTime === newEvent.startTime && oldEvent.endTime === newEvent.endTime);
    //     if (!found) {
    //       addStateEvent(newEvent);
    //     }
    //   });

    //   old.forEach((oldEvent) => {
    //     const found = newEvents.find((newEvent) => newEvent.startTime === oldEvent.startTime && newEvent.endTime === oldEvent.endTime);
    //     if (!found) {
    //       const box = stateEventBoxes.find((b) => b._time === oldEvent.startTime * 1000 && b._end === oldEvent.endTime * 1000);
    //       removeBox(box, series[0]);
    //       stateEventBoxes = stateEventBoxes.filter((b) => !(b._time === oldEvent.startTime * 1000 && b._end === oldEvent.endTime * 1000));
    //     }
    //   });

    //   oldEvents = JSON.parse(JSON.stringify(newEvents)); // Create a deep copy of newEvents
    // }
    // if (events && events.length) {
    //   stateEventBoxes.forEach((box) => {
    //     removeBox(box, series[0]);
    //   });
    //   stateEventBoxes = showStateEvents(chart, series[0], timeSeries.value, events, undefined, 10) || [];
    // }
  },
  { deep: true },
);

function addStateEvent(event: Event) {
  let box = drawStateEvent(event, chart as IChartApi, series[0], undefined, 10);
  if (box) stateEventBoxes.push(box);
}
</script>

<style scoped>
.lw-chart {
  height: 100%;
}
</style>
