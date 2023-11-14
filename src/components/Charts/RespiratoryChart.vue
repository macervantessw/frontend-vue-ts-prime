<template>
  <div ref="chartContainer" class="lw-chart relative"></div>
</template>

<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, defineExpose, defineProps, PropType } from "vue";
import { IChartApi, ISeriesApi, LineData, Time, UTCTimestamp, createChart } from "lightweight-charts";
import { useChartsStore } from "../../store";
import { getData, getAverage } from "../../utilities/file.utilities";
import { CHART_OPTIONS, SIGNALS, LINE_OPTIONS } from "../../constants";
import JSZip from "jszip";
import { Serie, Event } from "../../interfaces";
import dayjs from "dayjs";
import { showRespiratoryEvents } from "../../utilities/chart.utilities";

const chartsStore = useChartsStore();
const props = defineProps({
  files: {
    type: Object as PropType<Record<string, JSZip.JSZipObject>>,
    required: true,
  },
  respiratoryEvents: {
    type: Object as PropType<Event[]> | undefined,
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

// Auto resizes the chart when the browser window is resized.
const resizeHandler = () => {
  if (!chart || !chartContainer.value) return;
  const dimensions = chartContainer.value.getBoundingClientRect();
  chart.resize(dimensions.width, dimensions.height);
};

onMounted(() => {
  // Create the Lightweight Charts Instance using the container ref.
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
      // time will be in the same format that we supplied to setData.
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

    promises.push(generateLineSeries(SIGNALS.AIR_FLOW, "Air Flow", "#ffb703"));
    promises.push(generateLineSeries(SIGNALS.BASAL_AIR_FLOW, "Basal Air Flow", "#0077b6"));
    promises.push(generateLineSeries(SIGNALS.MOVEMENT, "Movement", "#80b918"));

    Promise.all(promises).then(() => {
      chart?.timeScale().setVisibleRange({
        from: chartsStore.timeAxis[0] as UTCTimestamp,
        to: (chartsStore.timeAxis[0] + 10 * 60 * 1000) as UTCTimestamp,
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
    });
  },
);

// watch(
//   () => chartsStore.selection.range,
//   (newVal) => {
//     if (!newVal || !chart || !chart.timeScale()) return;
//     chart.timeScale().setVisibleLogicalRange(newVal);
//   },
//   { deep: true },
// );

function generateLineSeries(signal: string, name: string, color: string): Promise<void> {
  return new Promise((resolve) => {
    getData(props.files, chartsStore.timeAxis, signal).then((data) => {
      const serie = chart?.addLineSeries({ ...LINE_OPTIONS, color: color });
      serie?.setData(data as any);
      series?.push({ name: name, serie: serie as ISeriesApi<"Line">, id: signal });
      if (signal === SIGNALS.AIR_FLOW && serie) showRespiratoryEvents(chart, serie, data as LineData<Time>[], props.respiratoryEvents);
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
