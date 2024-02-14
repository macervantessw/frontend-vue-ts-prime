<template>
  <div>
    <div ref="chartContainer" class="lw-chart absolute w-full" :class="{ 'opacity-0': !chartsStore.allRendered }"></div>
    <Skeleton v-if="!chartsStore.allRendered" class="w-full h-full absolute"></Skeleton>
    <ContextMenu ref="stateMenu" :model="items" />
  </div>
</template>

<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, defineExpose } from "vue";
import { IChartApi, ISeriesApi, LineData, MouseEventParams, Time, UTCTimestamp, createChart } from "lightweight-charts";
import { useChartsStore, useSessionsStore } from "../../store";
import { CHART_OPTIONS, LINE_OPTIONS, SIGNALS, STATES, VISIBLE_MINUTES } from "../../constants";
import { Event, Serie } from "../../interfaces";
import { showStateEvents, drawBox, removeBox, drawStateEvent } from "../../utilities/chart.utilities";
import Skeleton from "primevue/skeleton";
import { Box } from "./plugins/box";
import i18n from "../../i18n";
import ContextMenu from "primevue/contextmenu";

const { t } = i18n.global;
const chartsStore = useChartsStore();
const sessionsStore = useSessionsStore();
const stateMenu = ref();
let series: Serie<"Line">[] = [];
let chart: IChartApi | null = null;
let eventBoxes: Box[] = [];
let timeFrom: number = 0;
let timeTo: number = 0;
let selectedFrom: number = 0;
let selectedTo: number = 0;
let selectionBox: Box | undefined = undefined;

const chartContainer = ref();
const serie = () => series.find((s) => s.id === SIGNALS.STATE)?.serie as ISeriesApi<"Line">;
// const props = defineProps({
//   stateEvents: {
//     type: Object as PropType<Event[] | undefined>,
//     required: true,
//   },
// });

// const stateEvents = defineModel<Event[]>("stateEvents");

const items = ref([
  { label: t("Awake"), command: () => modifyStateEvents(STATES.AWAKE) },
  { label: t("Sleeping"), command: () => modifyStateEvents(STATES.SLEEPING) },
  { label: t("Unknown"), command: () => modifyStateEvents(STATES.UNKNOWN) },
  { label: t("Micro-awake"), command: () => modifyStateEvents(STATES.MICROAWAKE) },
]);

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
    const serie = series.find((s) => s.id === SIGNALS.STATE)?.serie as ISeriesApi<"Line">;
    removeBox(selectionBox, serie);
    drawSelectionBox(param, serie);
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
  if (eventBoxes) {
    eventBoxes = [];
  }
});

function drawSelectionBox(param: MouseEventParams, serie: ISeriesApi<"Line">) {
  if (param.sourceEvent?.altKey) {
    if (timeFrom === 0) {
      timeFrom = param.time as UTCTimestamp;
      timeTo = 0;
    } else if (timeTo === 0) {
      timeTo = param.time as UTCTimestamp;
      selectionBox = drawBox(chart, timeFrom as Time, timeTo as Time, serie, "rgba(14, 195, 134, 0.25)");
      try {
        selectedFrom = Math.min(timeFrom, timeTo);
        selectedTo = Math.max(timeFrom, timeTo);
        showContextualMenu(param.sourceEvent);
      } catch (e) {
        // console.log(e);
      } finally {
        timeFrom = 0;
      }
    }
  } else {
    timeFrom = 0;
    timeTo = 0;
  }
}

const showContextualMenu = (event: any) => {
  stateMenu.value.show(event);
};

function modifyStateEvents(eventType: number) {
  let event: Event | undefined = undefined;
  if (isInsideEvent() && event) {
    if ((event as Event).eventType === eventType) return;
    const eventCopy: Event = JSON.parse(JSON.stringify(event));
    removeStateEvent(event);
    cutBothEvents(event, eventCopy);
    addStateEvent(event);
    addStateEvent(eventCopy);
  } else if (isFullOutsideEvent()) {
    const previousEvent = sessionsStore.selectedSession?.Data.StateEvents?.find(
      (event) => event.startTime * 1000 <= selectedFrom && event.endTime * 1000 >= selectedFrom,
    );
    const nextEvent = sessionsStore.selectedSession?.Data.StateEvents?.find((event) => event.endTime * 1000 > selectedTo && event.startTime * 1000 <= selectedTo);
    if (!previousEvent || !nextEvent) return;
    removeStateEvent(previousEvent);
    removeStateEvent(nextEvent);
    const innerEvents = sessionsStore.selectedSession?.Data.StateEvents?.filter((event) => event.startTime * 1000 > selectedFrom && event.endTime * 1000 < selectedTo);
    innerEvents?.forEach((event) => removeStateEvent(event));
    if (eventType === previousEvent?.eventType && eventType === nextEvent?.eventType) {
      previousEvent.endTime = nextEvent.endTime;
      // deleteEvent(nextEvent);
    } else if (eventType === previousEvent?.eventType) {
      cutNextEvent(previousEvent, nextEvent);
    } else if (eventType === nextEvent?.eventType) {
      cutPreviousEvent(previousEvent, nextEvent);
    } else {
      cutBothEvents(previousEvent, nextEvent);
    }
    addStateEvent(previousEvent);
    addStateEvent(nextEvent);
  } else if (isPartlyOutEvent()) {
    const previousEvent = sessionsStore.selectedSession?.Data.StateEvents?.find(
      (event) => event.startTime * 1000 <= selectedFrom && event.endTime * 1000 >= selectedFrom,
    );
    const nextEvent = sessionsStore.selectedSession?.Data.StateEvents?.find((event) => event.endTime * 1000 > selectedTo && event.startTime * 1000 <= selectedTo);
    if (!previousEvent || !nextEvent) return;
    removeStateEvent(previousEvent);
    removeStateEvent(nextEvent);
    if (eventType === previousEvent?.eventType) {
      cutNextEvent(previousEvent, nextEvent);
    } else if (eventType === nextEvent?.eventType) {
      cutPreviousEvent(previousEvent, nextEvent);
    } else {
      cutBothEvents(previousEvent, nextEvent);
    }
    addStateEvent(previousEvent);
    addStateEvent(nextEvent);
  } else {
    createNewEvent(selectedFrom, selectedTo, eventType);
  }

  function cutBothEvents(previousEvent: Event, nextEvent: Event) {
    previousEvent.endTime = selectedFrom / 1000;
    nextEvent.startTime = selectedTo / 1000;
    createNewEvent(selectedFrom, selectedTo, eventType);
  }

  function cutPreviousEvent(previousEvent: Event, nextEvent: Event) {
    previousEvent.endTime = selectedFrom / 1000;
    nextEvent.startTime = selectedFrom / 1000;
  }
  function cutNextEvent(previousEvent: Event, nextEvent: Event) {
    previousEvent.endTime = selectedTo / 1000;
    nextEvent.startTime = selectedTo / 1000;
  }

  function isInsideEvent(): boolean {
    event = sessionsStore.selectedSession?.Data.StateEvents?.find((event) => event.startTime * 1000 <= selectedFrom && event.endTime * 1000 >= selectedTo);
    return !!event;
  }
  function isFullOutsideEvent() {
    event = sessionsStore.selectedSession?.Data.StateEvents?.find((event) => event.startTime * 1000 > selectedFrom && event.endTime * 1000 < selectedTo);
    return !!event;
  }
  function isPartlyOutEvent() {
    return !!sessionsStore.selectedSession?.Data.StateEvents?.find((event) => selectedFrom < event.startTime * 1000 && selectedTo < event.endTime * 1000);
  }
}
function addStateEvent(event: Event) {
  let box = drawStateEvent(event, chart as IChartApi, serie(), 10, 20);
  if (box) eventBoxes.push(box);
  if (sessionsStore.selectedSession)
    sessionsStore.selectedSession.Data.StateEvents = sessionsStore.selectedSession.Data.StateEvents?.concat(event).sort((a, b) => a.startTime - b.startTime);
}
function removeStateEvent(event: Event) {
  removeBox(findBox(event), serie());
  eventBoxes = eventBoxes.filter((b) => b._time !== event.startTime * 1000 && b._end !== event.endTime * 1000);
  if (sessionsStore.selectedSession)
    sessionsStore.selectedSession.Data.StateEvents = sessionsStore.selectedSession.Data.StateEvents?.filter(
      (e) => e.startTime !== event.startTime && e.endTime !== event.endTime,
    );
}
function findBox(event: Event) {
  return eventBoxes.find((b) => b._time === event.startTime * 1000 && b._end === event.endTime * 1000);
}

function createNewEvent(startTime: number, endTime: number, eventType: number) {
  const newEvent: Event = {
    startTime: startTime / 1000,
    endTime: endTime / 1000,
    eventType: eventType,
  };
  addStateEvent(newEvent);
}
watch(
  () => chartsStore.timeAxis,
  () => {
    const timeSeries = chartsStore.timeAxis.map((item) => {
      return { time: item, value: 0 } as LineData;
    });
    const serie = chart?.addLineSeries({ ...LINE_OPTIONS, color: "#80b918" });
    serie?.setData(timeSeries);
    // console.log("State has been rendered");
    chartsStore.stateChartRendered = true;
    series?.push({ name: SIGNALS.STATE, serie: serie as ISeriesApi<"Line">, id: SIGNALS.STATE });
    chart?.timeScale().setVisibleRange({
      from: chartsStore.timeAxis[0] as UTCTimestamp,
      to: (chartsStore.timeAxis[0] + VISIBLE_MINUTES * 60 * 1000) as UTCTimestamp,
    });

    if (serie) eventBoxes = showStateEvents(chart, serie, timeSeries, sessionsStore.selectedSession?.Data.StateEvents, 10, 20) || [];
  },
);
</script>

<style scoped>
.lw-chart {
  height: 100%;
}
</style>
