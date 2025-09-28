<template>
  <div>
    <div ref="chartContainer" class="lw-chart absolute w-full" :class="{ 'opacity-0': !chartsStore.allRendered }"></div>
    <ZoomControls class="absolute right-0 m-2 z-5" :class="{ 'opacity-0': !chartsStore.allRendered }" @zoom-in="zoom(10000)" @zoom-out="zoom(-10000)" />
    <Skeleton v-if="!chartsStore.allRendered" class="w-full h-full absolute"></Skeleton>
    <ChartTooltip ref="tooltip" :show="showTooltip" :style="{ left: leftPosition }">
      <div style="color: rgba(239, 83, 80, 1)">Attenuation</div>
      <div style="font-size: 24px; margin: 4px 0px; color: black">
        {{ attenuation.toFixed(2) }}
      </div>
      <div style="color: black">{{ dayjs(dateStr).format("HH:mm:ss:SSS") }}</div>
    </ChartTooltip>
    <span v-if="selectedTime" id="selected-time" class="absolute p-1 px-3 m-1 text-lg z-5 font-semibold border-round">{{ t("selected-time") }}: {{ selectedTime }}</span>
    <ContextMenu ref="menu" :model="items" />
  </div>
</template>
<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, defineExpose, defineProps, PropType } from "vue";
import { IChartApi, ISeriesApi, LineData, MouseEventParams, Time, UTCTimestamp, createChart } from "lightweight-charts";
import { useChartsStore, useSessionsStore } from "../../store";
import { getData, getAverage } from "../../utilities/file.utilities";
import { showRespiratoryEvents, removeBox, drawBox, showMovementEvents } from "../../utilities/chart.utilities";
import { CHART_OPTIONS, SIGNALS, LINE_OPTIONS, VISIBLE_MINUTES, RESPIRATORY_EVENTS } from "../../constants";
import JSZip from "jszip";
import { Serie, Event } from "../../interfaces";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import Skeleton from "primevue/skeleton";
import { Box } from "./plugins/box";
import i18n from "../../i18n";
import ChartTooltip from "./ChartTooltip.vue";
import ContextMenu from "primevue/contextmenu";
import ZoomControls from "./ZoomControls.vue";
import { useUsersStore } from "../../store";
import type { MenuItem } from "primevue/menuitem";


dayjs.extend(duration);

const { t } = i18n.global;
const attenuation = ref(0);
const chartContainer = ref();
const chartsStore = useChartsStore();
const dateStr = ref();
const leftPosition = ref("0px");
const menu = ref();
const selectedTime = ref("");
const sessionsStore = useSessionsStore();
const showTooltip = ref(false);
const tooltip = ref();


let addedEvents: Box[] = [];
let chart: IChartApi | null = null;
let index = -1;
let selectedEvent: Event | undefined = undefined;
let selectionBox: Box | undefined = undefined;
let series: Serie<"Line">[] = [];
let timeFrom = 0;
let timeTo = 0;
let maxScaleValue = ref(10000);

const props = defineProps({
  files: {
    type: Object as PropType<Record<string, JSZip.JSZipObject>>,
    required: true,
  },
  respiratoryEvents: {
    type: Array as PropType<Event[] | undefined>,
    required: true,
  },
  movementEvents: {
    type: Array as PropType<Event[] | undefined>,
    required: true,
  },
});

const getChart = () => {
  return chart;
};

const getSeries = () => {
  return series;
};

defineExpose({ getChart, getSeries, changeEvent });

onMounted(() => {
  chart = createChart(chartContainer.value, { ...CHART_OPTIONS, timeScale: { visible: false } });
  const toolTipWidth = 96;
  chart.subscribeCrosshairMove((param) => {
    if (
      param.point === undefined ||
      !param.time ||
      param.point.x < 0 ||
      param.point.x > chartContainer.value.clientWidth ||
      param.point.y < 0 ||
      param.point.y > chartContainer.value.clientHeight
    ) {
      showTooltip.value = false;
    } else {
      dateStr.value = param.time;
      showTooltip.value = true;
      const basalSerie = series.find((serie) => serie.id === SIGNALS.BASAL_AIR_FLOW);
      const airFlowserie = series.find((serie) => serie.id === SIGNALS.AIR_FLOW);
      if (basalSerie && airFlowserie) {
        const basalAirFlow: any = param.seriesData.get(basalSerie.serie);
        const airFlow: any = param.seriesData.get(airFlowserie.serie);
        const basalData = basalAirFlow?.value !== undefined ? basalAirFlow.value : basalAirFlow.close;
        const airFlowData = airFlow?.value !== undefined ? airFlow.value : airFlow.close;
        attenuation.value = ((airFlowData - basalData) / basalData) * 100;
      }

      if (chart) {
        let left = Number(param.point.x); // relative to timeScale
        const timeScaleWidth = chart?.paneSize().width;
        const priceScaleWidth = chart?.priceScale("left").width();
        const halfTooltipWidth = toolTipWidth / 2;
        left += priceScaleWidth - halfTooltipWidth;
        left = Math.min(left, priceScaleWidth + timeScaleWidth - toolTipWidth);
        left = Math.max(left, priceScaleWidth);

        leftPosition.value = left + "px";
      }
    }
  });

  chart.subscribeClick((param: MouseEventParams) => {
    const serie = series.find((s) => s.id === SIGNALS.AIR_FLOW)?.serie as ISeriesApi<"Line">;
    chartsStore.setCurrentTime(param.time as number);
    removeBox(selectionBox, serie);
    selectedTime.value = "";
    if (param.sourceEvent?.altKey) {
      if (timeFrom === 0) {
        timeFrom = param.time as UTCTimestamp;
        timeTo = 0;
      } else if (timeTo === 0) {
        timeTo = param.time as UTCTimestamp;
        const totalTime = dayjs.duration(Math.max(timeTo, timeFrom) - Math.min(timeTo, timeFrom));
        selectedTime.value = `${totalTime.hours() ? totalTime.hours() + "h " : ""} ${totalTime.minutes() ? totalTime.minutes() + "m " : ""} ${
          totalTime.seconds() ? totalTime.seconds() + "s" : ""
        }`;
        selectionBox = drawBox(chart, timeFrom as Time, timeTo as Time, serie, "rgba(14, 195, 134, 0.25)", `${selectedTime.value}`);
        timeFrom = 0;
      }
    }
  });

  chart.subscribeDblClick((param: MouseEventParams) => {
    const usersStore = useUsersStore();
    //if (!usersStore.canEdit) return;
    if (!param.time || !props.respiratoryEvents) return;
    const time = (param.time as UTCTimestamp) / 1000;

    const foundEvent = props.respiratoryEvents.find((event, i) => {
      if (event.startTime <= time && event.endTime >= time) {
        index = i;
        return true;
      }
    });

    if (foundEvent) {
      if (foundEvent.eventType === RESPIRATORY_EVENTS.EVENT_TYPE_APNEA) {
        selectedEvent = foundEvent;
        showContextualMenu(param.sourceEvent);
      } else {
        setAsApneaEvent(foundEvent);
      }
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
});

function zoom(quantity: number) {
  if (maxScaleValue.value < 20000) quantity = quantity / 6;
  else if (maxScaleValue.value < 35000) quantity = quantity / 2;
  maxScaleValue.value += quantity;

  if (maxScaleValue.value < 0) maxScaleValue.value = 0;
  const autoScaleInfoProvider = {
    priceRange: {
      minValue: 0,
      maxValue: maxScaleValue.value,
    },
  };
  series.forEach((serie) => {
    serie.serie.applyOptions({
      autoscaleInfoProvider: () => autoScaleInfoProvider,
    });
  });
}

function generateLineSeries(signal: string, name: string, color: string): Promise<void> {
  return new Promise((resolve) => {
    getData(props.files, chartsStore.timeAxis, signal).then((data) => {
      const serie = chart?.addLineSeries({ ...LINE_OPTIONS, color: color });
      serie?.setData(data as any);
      series?.push({ name: name, serie: serie as ISeriesApi<"Line">, id: signal });
      if (props.respiratoryEvents && signal === SIGNALS.AIR_FLOW && serie) {
        addedEvents = showRespiratoryEvents(chart, serie, data as LineData<Time>[], props.respiratoryEvents) || [];
      }
      if (props.movementEvents && signal === SIGNALS.MOVEMENT && serie) {
        showMovementEvents(chart, serie, data as LineData<Time>[], props.movementEvents, [11, 17], undefined, 15);
      }
      resolve();
    });
  });
}

const showContextualMenu = (event: any) => {
  menu.value.show(event);
};

const setEventAsSuspicious = () => {
  if (!selectedEvent) return;
  changeEvent(selectedEvent, RESPIRATORY_EVENTS.DISCARDABLE_ISOLATED);
};
const setEventAsCentralApnea = () => {
  if (!selectedEvent) return;
  changeEvent(selectedEvent, RESPIRATORY_EVENTS.EVENT_TYPE_CENTRAL_APNEA);
};

function changeEvent(event: Event, eventType: number, i: number = index) {
  chartsStore.respiratoryEvents = [];
  event.eventType = eventType;
  const box = findBox(event);
  const serie = series.find((s) => s.id === SIGNALS.AIR_FLOW)?.serie as ISeriesApi<"Line">;
  removeBox(box, serie);
  removeFromAddedEvents(event);
  if (eventType !== RESPIRATORY_EVENTS.DISCARDABLE_AWAKE) drawEvent(event);
  chartsStore.respiratoryEvents.push(event);
  chartsStore.setEventType(
    event,
    eventType,
    `/users/${sessionsStore.selectedSession?.userId}/Sessions/${sessionsStore.selectedSession?.DeviceId}\\${sessionsStore.selectedSession?.SessionId}\\/Data/RespiratoryEvents/${i}`,
  );
  chartsStore.updateEvents();
}

const setEventAsDiscarded = () => {
  if (!selectedEvent) return;
  changeEvent(selectedEvent, RESPIRATORY_EVENTS.DISCARDABLE_AWAKE);
};

function removeFromAddedEvents(event: Event) {
  addedEvents = addedEvents.filter((b) => b._time !== event.startTime * 1000 && b._end !== event.endTime * 1000);
}
function setAsApneaEvent(event: Event) {
  changeEvent(event, RESPIRATORY_EVENTS.EVENT_TYPE_APNEA);
}

function findBox(event: Event) {
  return addedEvents.find((b) => b._time === event.startTime * 1000 && b._end === event.endTime * 1000);
}
function drawEvent(event: Event) {
  const from = (event.startTime * 1000) as Time;
  const to = (event.endTime * 1000) as Time;

  let color = "hsla(207, 73%, 39%, 0.2)";
  if (event.eventType === RESPIRATORY_EVENTS.DISCARDABLE_ISOLATED) color = "hsla(54, 97%, 56%, 0.2)";
  else if (event.eventType === RESPIRATORY_EVENTS.EVENT_TYPE_CENTRAL_APNEA) color = "hsl(24, 76%, 51%,0.2)";

  const serie = series.find((s) => s.id === SIGNALS.AIR_FLOW)?.serie as ISeriesApi<"Line">;
  const box = drawBox(chart, from, to, serie, color);
  if (box) addedEvents.push(box);
}
const items = ref([
  { label: t("Central Apnea"), command: setEventAsCentralApnea },
  { separator: true },
  { label: t("Suspicius"), command: setEventAsSuspicious },
  { label: t("Discard"), command: setEventAsDiscarded },
]);

watch(
  () => chartsStore.timeAxis,
  async () => {
    const promises: Promise<void>[] = [];
    const average = await getAverage(props.files, SIGNALS.AIR_FLOW);

    promises.push(generateLineSeries(SIGNALS.AIR_FLOW, "Air Flow", "#ffb703"));
    promises.push(generateLineSeries(SIGNALS.BASAL_AIR_FLOW, "Basal Air Flow", "#0077b6"));
    promises.push(generateLineSeries(SIGNALS.MOVEMENT, "Movement", "#80b918"));

    Promise.all(promises).then(() => {
      chart?.timeScale().setVisibleRange({
        from: chartsStore.timeAxis[0] as UTCTimestamp,
        to: (chartsStore.timeAxis[0] + VISIBLE_MINUTES * 60 * 1000) as UTCTimestamp,
      });

      const airFlowSeries = series.find((s) => s.id === SIGNALS.AIR_FLOW)?.serie;
      const basalAirFlowSeries = series.find((s) => s.id === SIGNALS.BASAL_AIR_FLOW)?.serie;
      const movement = series.find((s) => s.id === SIGNALS.MOVEMENT)?.serie;

      maxScaleValue.value = Math.floor(average * 3);

      const autoScaleInfoProvider = {
        priceRange: {
          minValue: 0,
          maxValue: maxScaleValue.value,
        },
      };

      if (airFlowSeries) {
        airFlowSeries.applyOptions({
          autoscaleInfoProvider: () => autoScaleInfoProvider,
        });
        airFlowSeries.priceScale().applyOptions({
          autoScale: true,
          scaleMargins: {
            top: 0,
            bottom: 0.1,
          },
        });
        airFlowSeries.createPriceLine({
          color: "#ffb703",
          price: average,
          title: "Average: " + average.toFixed(0) + "",
          lineStyle: 1,
          lineWidth: 1,
          axisLabelVisible: true,
        });
      }
      if (basalAirFlowSeries) {
        basalAirFlowSeries.applyOptions({
          autoscaleInfoProvider: () => autoScaleInfoProvider,
        });
        basalAirFlowSeries.priceScale().applyOptions({
          autoScale: true,
        });
      }
      if (movement) {
        movement.applyOptions({
          autoscaleInfoProvider: () => autoScaleInfoProvider,
          lineWidth: 1,
        });
        movement.priceScale().applyOptions({
          autoScale: true,
        });
      }
      // console.log("Respiratory Chart has been rendered");
      chartsStore.respiratoryChartRendered = true;
    });
  },
);
</script>

<style scoped>
.lw-chart {
  height: 100%;
}
#selected-time {
  background: #68b0a8;
  /* border-radius: 2rem; */
  color: white;
}
</style>
