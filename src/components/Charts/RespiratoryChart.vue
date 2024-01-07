<template>
  <div>
    <div ref="chartContainer" class="lw-chart absolute w-full" :class="{ 'opacity-0': !chartsStore.allRendered }"></div>
    <Skeleton v-if="!chartsStore.allRendered" class="w-full h-full absolute"></Skeleton>
    <span v-if="selectedTime != 0" id="selected-time" class="absolute p-1 px-3 m-1 text-lg z-5 font-semibold border-round"
      >{{ t("selected-time") }}: {{ selectedTime.toFixed(1) }}s</span
    >
  </div>
</template>

<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, defineExpose, defineProps, PropType } from "vue";
import { IChartApi, ISeriesApi, LineData, MouseEventParams, Time, UTCTimestamp, createChart } from "lightweight-charts";
import { useChartsStore, useMessagesStore } from "../../store";
import { getData, getAverage } from "../../utilities/file.utilities";
import { CHART_OPTIONS, SIGNALS, LINE_OPTIONS, VISIBLE_MINUTES } from "../../constants";
import JSZip from "jszip";
import { Serie, Event } from "../../interfaces";
import dayjs from "dayjs";
import { showRespiratoryEvents } from "../../utilities/chart.utilities";
import Skeleton from "primevue/skeleton";
import { Box } from "./plugins/box";
import i18n from "../../i18n";

const { t } = i18n.global;
const box = ref<Box | undefined>();
const chartsStore = useChartsStore();
let timeFrom = 0;
let timeTo = 0;

const selectedTime = ref(0);

const props = defineProps({
  files: {
    type: Object as PropType<Record<string, JSZip.JSZipObject>>,
    required: true,
  },
  respiratoryEvents: {
    type: Object as PropType<Event[] | undefined> | undefined,
    required: true,
  },
});

// Lightweight Charts™ instances are stored as normal JS variables
// If you need to use a ref then it is recommended that you use `shallowRef` instead
let series: Serie<"Line">[] = [];
let chart: IChartApi | null = null;

const chartContainer = ref();

const getChart = () => {
  return chart;
};

const getSeries = () => {
  return series;
};

defineExpose({ getChart, getSeries });

onMounted(() => {
  chart = createChart(chartContainer.value, CHART_OPTIONS);

  const toolTipWidth = 96;

  // Create and style the tooltip html element
  const toolTip = document.createElement("div");
  toolTip.style.cssText = `width: ${toolTipWidth}px; height: 20rem; position: absolute; display: none; padding: 8px; box-sizing: border-box; font-size: 12px; text-align: left; z-index: 1000; top: 12px; left: 12px; pointer-events: none; border-radius: 4px 4px 0px 0px; border-bottom: none; box-shadow: 0 2px 5px 0 rgba(117, 134, 150, 0.45);font-family: -apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, Ubuntu, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;`;
  toolTip.style.background = `rgba(${"255, 255, 255"}, 0.25)`;
  toolTip.style.color = "black";
  toolTip.style.borderColor = "rgba( 239, 83, 80, 1)";
  chartContainer.value.appendChild(toolTip);

  // update tooltip
  chart.subscribeCrosshairMove((param) => {
    if (
      param.point === undefined ||
      !param.time ||
      param.point.x < 0 ||
      param.point.x > chartContainer.value.clientWidth ||
      param.point.y < 0 ||
      param.point.y > chartContainer.value.clientHeight
    ) {
      toolTip.style.display = "none";
    } else {
      // thus it will be YYYY-MM-DD
      const dateStr: any = param.time;
      toolTip.style.display = "block";
      const basalSerie = series.find((serie) => serie.id === SIGNALS.BASAL_AIR_FLOW);
      const airFlowserie = series.find((serie) => serie.id === SIGNALS.AIR_FLOW);
      if (basalSerie && airFlowserie) {
        const basalAirFlow: any = param.seriesData.get(basalSerie.serie);
        const airFlow: any = param.seriesData.get(airFlowserie.serie);
        const basalData = basalAirFlow?.value !== undefined ? basalAirFlow.value : basalAirFlow.close;
        const airFlowData = airFlow?.value !== undefined ? airFlow.value : airFlow.close;

        toolTip.innerHTML = `<div style="color: ${"rgba( 239, 83, 80, 1)"}">Attenuation</div><div style="font-size: 24px; margin: 4px 0px; color: ${"black"}">
        ${(((airFlowData - basalData) / basalData) * 100).toFixed(2)}
        </div><div style="color: ${"black"}">
        ${dayjs(dateStr).format("HH:mm:ss:SSS")}
        </div>`;
      }

      if (chart) {
        let left = Number(param.point.x); // relative to timeScale
        const timeScaleWidth = chart?.timeScale().width();
        const priceScaleWidth = chart?.priceScale("left").width();
        const halfTooltipWidth = toolTipWidth / 2;
        left += priceScaleWidth - halfTooltipWidth;
        left = Math.min(left, priceScaleWidth + timeScaleWidth - toolTipWidth);
        left = Math.max(left, priceScaleWidth);

        toolTip.style.left = left + "px";
        toolTip.style.top = 0 + "px";
      }
    }
  });

  chart.subscribeClick((param: MouseEventParams) => {
    if (param.sourceEvent?.altKey) {
      if (timeFrom === 0) {
        timeFrom = param.time as UTCTimestamp;
        timeTo = 0;
      } else if (timeTo === 0) {
        timeTo = param.time as UTCTimestamp;
        const totalTime = timeTo - timeFrom;
        useMessagesStore().setSuccessMessage(`Selected time: ${totalTime / 1000} seconds`);
        if (box.value) series[0].serie.detachPrimitive(box.value);
        selectedTime.value = Number(totalTime / 1000);
        drawBox(timeFrom as Time, timeTo as Time, `${selectedTime.value.toFixed(1)} s`);
        timeFrom = 0;
      }
    }
    // if (!param.point || !param.time) return;
    // chartsStore.setCurrentTime(param.time as UTCTimestamp);
    // setSelectionBox(param.time);
  });
});
function drawBox(from: Time, to: Time, text: string) {
  if (box.value) series[0].serie.detachPrimitive(box.value);
  if (!chart) return;
  const data = Array.from(series[0].serie.data()) as LineData<Time>[];
  box.value = new Box(chart, series[0].serie, data, from, to, 0, undefined, {
    showLabel: false,
    color: "rgba(14, 195, 134, 0.25)",
    width: 40,
  });
  series[0].serie.attachPrimitive(box.value);
  series[0].serie.setMarkers([
    {
      time: to,
      position: "aboveBar",
      shape: "circle",
      color: "",
      size: 0,
      text: text,
      id: "selectionTime",
    },
  ]);
  box.value.updateAllViews();
}
onUnmounted(() => {
  if (chart) {
    chart.remove();
    chart = null;
  }
  if (series) {
    series = [];
  }
});

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

      const autoScaleInfoProvider = {
        priceRange: {
          minValue: 0,
          maxValue: average * 2 || 100000,
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
      console.log("Respiratory Chart has been rendered");
      chartsStore.respiratoryChartRendered = true;
    });
  },
);
function generateLineSeries(signal: string, name: string, color: string): Promise<void> {
  return new Promise((resolve) => {
    getData(props.files, chartsStore.timeAxis, signal).then((data) => {
      const serie = chart?.addLineSeries({ ...LINE_OPTIONS, color: color });
      serie?.setData(data as any);
      series?.push({ name: name, serie: serie as ISeriesApi<"Line">, id: signal });
      if (props.respiratoryEvents) if (signal === SIGNALS.AIR_FLOW && serie) showRespiratoryEvents(chart, serie, data as LineData<Time>[], props.respiratoryEvents);
      resolve();
    });
  });
}
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
