<template>
  <div>
    <div ref="chartContainer" class="lw-chart absolute w-full" :class="{ 'opacity-0': !chartsStore.allRendered }"></div>
    <Skeleton v-if="!chartsStore.allRendered" class="w-full h-full absolute"></Skeleton>
    <ContextMenu ref="stateMenu" :model="items" />
  </div>
</template>

<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, defineExpose, nextTick } from "vue";
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
const emit = defineEmits(["eventChanged"]);
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
  const previousEvent = sessionsStore.selectedSession?.Data.StateEvents?.findLast((event) => event.startTime * 1000 <= selectedFrom);
  const nextEvent = sessionsStore.selectedSession?.Data.StateEvents?.find((event) => event.endTime * 1000 >= selectedTo);

  if (!previousEvent || !nextEvent) return;

  if (previousEvent === nextEvent) {
    if (previousEvent.eventType === eventType) {
      return;
    } else {
      const endTime = nextEvent.endTime;
      const type = previousEvent.eventType;
      cutEvent(previousEvent, previousEvent.startTime, selectedFrom);
      createNewEvent(selectedFrom, selectedTo, eventType);
      createNewEvent(selectedTo, endTime, type);
    }
  } else {
    if (previousEvent.eventType === eventType) {
      if (nextEvent.eventType === eventType) {
        cutEvent(previousEvent, previousEvent.startTime, nextEvent.endTime);
        removeStateEvent(nextEvent);
      } else {
        cutEvent(previousEvent, previousEvent.startTime, selectedTo);
        cutEvent(nextEvent, selectedTo, nextEvent.endTime);
      }
    } else {
      cutEvent(previousEvent, previousEvent.startTime, selectedFrom);
      if (nextEvent.eventType === eventType) {
        cutEvent(nextEvent, selectedFrom, nextEvent.endTime);
      } else {
        cutEvent(nextEvent, selectedTo, nextEvent.endTime);
        createNewEvent(selectedFrom, selectedTo, eventType);
      }
    }
  }
  sessionsStore.selectedSession?.Data.StateEvents?.forEach((event) => {
    if (event.startTime * 1000 > selectedFrom && event.endTime * 1000 < selectedTo) {
      removeStateEvent(event);
    }
  });

  nextTick(() => recalculateStatistics());

  function cutEvent(event: Event, startTime: number /* in seconds */, endTime: number) {
    removeStateEvent(event);
    event.startTime = startTime > 1000000000000 ? startTime / 1000 : startTime;
    event.endTime = endTime > 1000000000000 ? endTime / 1000 : endTime;
    addStateEvent(event);
  }
  function createNewEvent(startTime: number, endTime: number, eventType: number) {
    const newEvent: Event = {
      startTime: startTime > 1000000000000 ? startTime / 1000 : startTime,
      endTime: endTime > 1000000000000 ? endTime / 1000 : endTime,
      eventType: eventType,
    };
    addStateEvent(newEvent);
  }
  function recalculateStatistics() {
    if (eventType === STATES.AWAKE) {
      emit("eventChanged", { from: selectedFrom, to: selectedTo });
    }

    if (!sessionsStore.selectedSession) return;
    sessionsStore.selectedSession.SessionSleepTime = sessionsStore.selectedSession.Data.StateEvents.reduce((acc, event) => {
      if (event.eventType === STATES.SLEEPING) {
        acc += event.endTime - event.startTime;
      }
      return acc;
    }, 0);

    sessionsStore.selectedSession.SessionAwakeTime = sessionsStore.selectedSession.Data.StateEvents.reduce((acc, event) => {
      if (event.eventType === STATES.AWAKE || event.eventType === STATES.MICROAWAKE) {
        acc += event.endTime - event.startTime;
      }
      return acc;
    }, 0);

    sessionsStore.selectedSession.SessionNumAwakes = sessionsStore.selectedSession.Data.StateEvents.filter((event) => event.eventType === STATES.AWAKE).length;
    if (sessionsStore.selectedSession.SessionPLMIndex)
      sessionsStore.selectedSession.SessionPLMIndex =
        "" + Number(sessionsStore.selectedSession.SessionNumPLMEvents) / (sessionsStore.selectedSession.SessionSleepTime / 60 / 60);
  }
}
function addStateEvent(event: Event) {
  let box = drawStateEvent(event, chart as IChartApi, serie(), 10, 20);
  if (box) eventBoxes.push(box);
  if (sessionsStore.selectedSession)
    sessionsStore.selectedSession.Data.StateEvents = sessionsStore.selectedSession.Data.StateEvents?.concat(event).sort((a, b) => a.startTime - b.startTime);

  //Save it to firebase

  if (sessionsStore.selectedSession?.Data.StateEvents) {
    chartsStore.setEvents(
      sessionsStore.selectedSession.Data.StateEvents,
      `/users/${sessionsStore.selectedSession?.userId}/Sessions/${sessionsStore.selectedSession?.DeviceId}\\${sessionsStore.selectedSession?.SessionId}\\/Data/StateEvents/`,
    );
  }
}
function removeStateEvent(event: Event) {
  removeBox(findBox(event), serie());
  eventBoxes = eventBoxes.filter((b) => !(b._time === event.startTime * 1000 && b._end === event.endTime * 1000));
  if (sessionsStore.selectedSession)
    sessionsStore.selectedSession.Data.StateEvents = sessionsStore.selectedSession.Data.StateEvents?.filter(
      (e) => !(e.startTime === event.startTime && e.endTime === event.endTime),
    );
}
function findBox(event: Event) {
  return eventBoxes.find((b) => b._time === event.startTime * 1000 && b._end === event.endTime * 1000);
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
